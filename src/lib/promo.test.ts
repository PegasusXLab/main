import { describe, expect, it } from "vitest";
import { actionLabel, hasCreator, initials, platformOf, resolveCreatorLinks } from "./promo";
import { gallerySchema } from "./schema/validate";
import sample from "../fixtures/sample-3room.json";

describe("promo", () => {
  it("labels piece actions with an optional price", () => {
    expect(actionLabel()).toBe("Learn more");
    expect(actionLabel("buy", " $40 ")).toBe("Buy · $40");
    expect(actionLabel("presave")).toBe("Pre-save");
  });

  it("recognizes platforms from the address", () => {
    expect(platformOf("https://open.spotify.com/artist/x").label).toBe("Spotify");
    expect(platformOf("https://www.instagram.com/vic").label).toBe("Instagram");
    expect(platformOf("https://youtu.be/abc").label).toBe("YouTube");
    expect(platformOf("https://artist.bandcamp.com/album/a").label).toBe("Bandcamp");
    expect(platformOf("https://music.apple.com/us/album/1").label).toBe("Apple Music");
    expect(platformOf("https://www.vic.studio/").label).toBe("vic.studio");
  });

  it("keeps only https creator links, with custom labels winning", () => {
    expect(
      resolveCreatorLinks([
        { url: "https://open.spotify.com/artist/x" },
        { url: "javascript:alert(1)" },
        { url: "http://insecure.com" },
        { url: "https://vic.studio", label: "Portfolio" },
      ]).map((l) => l.label),
    ).toEqual(["Spotify", "Portfolio"]);
  });

  it("knows when there's a creator and makes initials", () => {
    expect(hasCreator(undefined)).toBe(false);
    expect(hasCreator({ name: "  " })).toBe(false);
    expect(hasCreator({ name: "Vic" })).toBe(true);
    expect(initials("Vic Googe")).toBe("VG");
    expect(initials("progsu")).toBe("P");
  });

  it("validates creator and piece action fields", () => {
    const g = JSON.parse(JSON.stringify(sample));
    g.creator = { name: "Vic", bio: "Producer", links: [{ url: "https://open.spotify.com/artist/x" }] };
    g.artworks[0].action = "buy";
    g.artworks[0].price = "$40";
    expect(gallerySchema.safeParse(g).success).toBe(true);
    g.creator.links = [{ url: "http://x.com" }];
    expect(gallerySchema.safeParse(g).success).toBe(false);
    g.creator.links = [];
    g.artworks[0].action = "steal";
    expect(gallerySchema.safeParse(g).success).toBe(false);
  });
});
