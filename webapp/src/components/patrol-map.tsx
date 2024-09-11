import { GoogleMapsEmbed } from "@next/third-parties/google";

export function PatrolMap() {
  return (
    <GoogleMapsEmbed
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}
      height={400}
      width="100%;"
      mode="search"
      q="Police Station in Singapore"
      zoom="12"
      loading="eager"
      style="border: 1px solid #e5e7eb; border-radius: 0.375rem;"
    />
  );
}
