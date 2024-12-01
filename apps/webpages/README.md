# VizTweak

VizTweak is a hosting service for files and supports dynamic conversion of images, videos based on links. Save files to S3 and convert them using imagor.

It's a simple service, to solve the hassle I was having with writing articles using markdown in vs code:

- Format incompatibility. The preview function of some editors does not support formats such as HEIC.
- Privacy. Images and videos may carry information such as location, time of shooting, etc. and should be shared on the web to avoid disclosure.
- Resizing. Sometimes I don't intend to use images that are too sharp to be manually resized with image editing tools.
- Watermarking. There are so many content farms these days that a watermark might help readers find the real source of content
- Remove unused files. There's always the possibility of replacing or deleting some external resources after an article has been edited, and I don't want to clean up those files purely manually

VizTweak aims to solve the above problem.
