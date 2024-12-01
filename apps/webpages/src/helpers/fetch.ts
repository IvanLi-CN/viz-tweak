export const checkStatus = async (response: Response) => {
  if (!response.status || response.status < 200 || response.status >= 300) {
    if (response.headers.get("Content-Type") === "application/json") {
      response.json().then((data) => {
        console.error(data);
        throw new Error(data.error || data.message || "Something went wrong");
      });
    }

    throw new Error(await response.text());
  }

  return response;
};