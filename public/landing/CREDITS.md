# Landing showcase artwork

The artworks shown on the landing page are public-domain paintings sourced from
**The Metropolitan Museum of Art — Open Access (CC0)**:
https://www.metmuseum.org/about-the-met/policies-and-documents/open-access

Images are served locally from `/public/landing/` so the landing works offline.
The conveyor uses the small JPEGs; the lightbox (T-148) uses the ~1600 px WebP copies in
`large/`, made from each object's `primaryImage` in the Met Collection API.

Titles, artists, dates and media were checked against the Met Collection API
(`collectionapi.metmuseum.org/public/collection/v1/objects/<id>`) on 2026-10-11.

| File                | Large                          | Artwork                                      | Artist                   | Date        | Met object |
| ------------------- | ------------------------------ | -------------------------------------------- | ------------------------ | ----------- | ---------- |
| `pearl-earring.jpg` | `large/study-young-woman.webp` | Study of a Young Woman                       | Johannes Vermeer         | ca. 1665–67 | 437879     |
| `water-lilies.jpg`  | `large/water-lilies.webp`      | Water Lilies                                 | Helena de Kay            | ca. 1870–77 | 899646     |
| `great-wave.jpg`    | `large/great-wave.webp`        | Under the Wave off Kanagawa (The Great Wave) | Katsushika Hokusai       | ca. 1830–32 | 45434      |
| `harvesters.jpg`    | `large/harvesters.webp`        | The Harvesters                               | Pieter Bruegel the Elder | 1565        | 435809     |
| `self-portrait.jpg` | `large/self-portrait.webp`     | Self-Portrait                                | Rembrandt van Rijn       | 1660        | 437397     |
| `sunflowers.jpg`    | `large/sunflowers.webp`        | Sunflowers                                   | Vincent van Gogh         | 1887        | 436524     |

Corrections on 2026-10-11 (T-148): the Vermeer's object id was 437881 (that is _Young Woman with
a Water Pitcher_); _Water Lilies_ was credited to Claude Monet with id 438807 (not a Met object) —
the painting is Helena de Kay's (899646).

All listed works are in the public domain; the Met publishes their images under CC0.
