// See https://developers.cloudflare.com/turnstile/
const secret: string = process.env.CLOUDFLARE_SECRET as string;

const verifyEndpoint =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const checkCloudflare = async (
  cloudflareCallback: string
): Promise<boolean> => {
  const cloudflareResponse = await fetch(verifyEndpoint, {
    method: "POST",
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(
      cloudflareCallback
    )}`,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  const data = await cloudflareResponse.json();

  return data.success;
};
