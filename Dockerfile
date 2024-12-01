# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp
COPY ./apps/server/package.json bun.lockb /temp/
RUN cd /temp && bun install

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/node_modules node_modules

COPY ./apps/server/src ./src
COPY ./apps/server/drizzle ./drizzle
COPY ./apps/server/db ./db
COPY ./apps/server/package.json .
COPY ./apps/server/tsconfig.json .
COPY ./apps/server/drizzle.config.ts .

COPY ./apps/webpages/dist ../webpages/dist

# run the app
USER bun
ENV DB_PATH="/home/bun/.power-desk/db.sqlite"
ENV PORT=24113
EXPOSE 24113/tcp
ENTRYPOINT [ "bun", "run", "./src/index.ts" ]
