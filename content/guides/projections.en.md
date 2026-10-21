---
slug: map-projections
title: Map Projections: Why Every World Map Is a Little Wrong
description: Why Greenland looks as big as Africa, what Mercator, Gall-Peters and Robinson get right and wrong, and which projection worldmap.tech uses.
---
Every flat world map distorts something, because the surface of a globe cannot be spread flat without stretching or tearing it. A map projection is the mapmaker's choice of what to give up: true shapes, true sizes, or a little of each. That choice is why Greenland can look like a continent on one map and a large island on another. worldmap.tech uses the Natural Earth projection, a compromise that shows the whole world at once without any region looking wildly out of proportion.

## Why no flat map can be perfect

Peel an orange and try to press the peel flat. It splits, or you have to stretch parts of it. The mathematician Carl Friedrich Gauss proved the formal version: the surface of a sphere cannot be shown on a plane without distortion. So every world map is a trade-off, and projections fall into three broad families:

- **Conformal** projections keep angles and the shapes of small areas correct, but let sizes drift.
- **Equal-area** projections keep every region at its true relative size, but bend shapes to do it.
- **Compromise** projections give up on perfection in both, aiming to keep every kind of error modest.

None of them is "the correct map"; each answers a different question.

## Mercator: why Greenland and Russia look enormous

Flemish mapmaker Gerardus Mercator presented his projection in 1569. It is conformal, and sailors loved one property in particular: a course with a constant compass bearing is a straight line on the map.

The cost is size: Mercator enlarges land more the farther it lies from the equator. At 60° latitude, roughly where Helsinki sits, everything is stretched to twice its width and twice its height, so areas look four times bigger than at the equator. Toward the poles the stretching never stops, which is why Antarctica becomes an endless white strip along the bottom. Some real numbers:

- **Greenland vs Africa:** Greenland covers about 2.17 million km² and Africa about 30.4 million km², so Africa is roughly 14 times larger. On a Mercator map they look about the same size.
- **Russia vs Africa:** Russia covers about 17.1 million km². On Mercator it looks bigger than Africa, yet Africa is nearly twice its size.
- **Greenland vs Algeria:** Algeria, at about 2.38 million km², is slightly larger than Greenland.

So why is Mercator still everywhere online? Google Maps adopted a variant called Web Mercator in 2005, and it became the standard for web maps, used by OpenStreetMap, Bing Maps and Mapbox too. When you zoom into a city, you need streets to cross at the right angles and roundabouts to look round, and a near-conformal projection delivers that at every zoom level. These services simply cut the map off at about 85° north and south, since the poles would sit infinitely far away. Mercator is excellent for finding a café and a poor picture of the whole planet.

## Equal-area maps: true sizes, unusual shapes

Equal-area projections fix the size problem: two regions that are equally large on the globe take up equal space on the map. The best known is the **Gall-Peters** projection, first described by James Gall in 1855 and promoted by Arno Peters from 1973 as a fairer picture of the world. It does show Africa and South America at their true size, but the tropics get stretched so much that Africa looks extremely elongated from north to south. Boston Public Schools began phasing in Gall-Peters maps in March 2017.

Other equal-area projections look more natural. **Mollweide**, first published in 1805, draws the world as a 2:1 ellipse; sizes are true, while shapes get noticeably distorted toward the edges. **Equal Earth**, published in 2018 by Bojan Šavrič, Bernhard Jenny and Tom Patterson, was designed after the Boston coverage as a better-looking alternative to Gall-Peters: it resembles the popular Robinson map but keeps every area true.

## Compromise maps: Robinson, Winkel Tripel and Natural Earth

Most atlases favor compromises. Arthur H. Robinson devised the **Robinson** projection in 1963, and National Geographic used it for its world maps from 1988. In 1998 the society switched to the **Winkel Tripel**, proposed by Oswald Winkel in 1921. "Tripel" is German for triple, after Winkel's goal of minimizing three kinds of distortion: area, direction and distance.

The **Natural Earth** projection is a younger member of this family. Cartographer Tom Patterson of the US National Park Service designed it in 2007, starting from the Robinson projection and making it slightly taller. Neither conformal nor equal-area, it is easy to recognize by its rounded corners where the sides meet the flat pole lines, a small hint that the Earth is round. Like Robinson, it still enlarges high latitudes somewhat, just nowhere near as much as Mercator does.

## What worldmap.tech uses, and why

The [world map](/) on worldmap.tech is drawn with the Natural Earth projection (d3's geoNaturalEarth1). The country outlines come from Natural Earth's public domain dataset, built by volunteers with support from the North American Cartographic Information Society, at its medium 1:50m scale. The shared name is no coincidence: Tom Patterson designed the projection and co-authored the original dataset. Still, they are separate things: one flattens the globe, the other draws the countries.

For a visited-countries map, a compromise makes sense. You want the whole world on one screen, every continent recognizable at a glance, and no Greenland or Russia swallowing half the picture. Small countries are still small, of course, which is what the search box is for.

## A big blue area is not a big share of the world

A large country fills a lot of the screen, but in the app it is still one country. The percentage counts countries, not land: it is the number of countries you've marked divided by 195, the 193 UN member states plus Vatican City and Palestine. Russia covers about 11% of the world's land, yet marking it adds the same 1/195, about half a percentage point, as marking Vatican City.

That cuts both ways. Visit Russia, Canada, China, the United States, Brazil and Australia, the six largest countries by area, and your map turns impressively blue, but you are at 3%. Spend a few summers crossing twenty European countries and the blue patch stays fairly small, yet you are at 10% and already a Globetrotter. [How many countries there are](/guides/how-many-countries-are-there/) explains the 195, and the [traveler levels guide](/guides/traveler-levels/) covers each milestone.

Open the map, tap the countries you've been to, and compare how much turns blue with your actual count.
