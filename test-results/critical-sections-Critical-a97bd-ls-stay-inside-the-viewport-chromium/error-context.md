# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-sections.spec.js >> Critical Theme Sections >> Phone mono shop and archive controls stay inside the viewport
- Location: tests/critical-sections.spec.js:243:3

# Error details

```
Error: phone mono product card should not extend past viewport

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 391
Received:    416.515625
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]:
      - heading "cineast" [level=1] [ref=e5]
      - generic [ref=e6]: NOW SHOWING / PREPARING THE FRAME
      - generic [ref=e9]: Journal indexed.
    - generic [ref=e10]: EST. 20XX / ARCHIVE SYSTEM ONLINE
  - navigation [ref=e11]:
    - generic [ref=e12]:
      - link "CINEAST home" [ref=e14] [cursor=pointer]:
        - /url: /
        - img [ref=e15]
        - generic [ref=e16]: CINEAST
      - generic [ref=e17]:
        - generic [ref=e18]:
          - button "Search" [ref=e19] [cursor=pointer]:
            - img [ref=e20]
          - button "Account" [ref=e23] [cursor=pointer]:
            - img [ref=e24]
          - link "Cart" [ref=e27] [cursor=pointer]:
            - /url: "#cart-drawer"
            - img [ref=e28]
        - button [ref=e31] [cursor=pointer]:
          - img [ref=e32]
  - main [ref=e33]:
    - generic [ref=e34]:
      - generic [ref=e35]:
        - generic [ref=e36]: SCENE 01 / NOW SHOWING
        - heading "Make your life cinematic." [level=1] [ref=e37]:
          - text: Make your life
          - text: cinematic.
        - paragraph [ref=e38]:
          - text: A cinematic lifestyle label built around mood,
          - text: framing, memory, and the art of the scene.
        - generic [ref=e39]:
          - link "SHOP THE DROP →" [ref=e40] [cursor=pointer]:
            - /url: "#shop"
          - link "READ THE JOURNAL" [ref=e41] [cursor=pointer]:
            - /url: "#journal"
      - generic [ref=e43]:
        - generic [ref=e45]: FRI 03:39:20 PM
        - generic [ref=e47]: LOCATION UNKNOWN
        - generic [ref=e48]: ARCHIVE ENTRY 001
        - generic [ref=e50]: SHOT IN MONO
    - region "CINEAST" [ref=e52]:
      - generic [ref=e53]:
        - generic [ref=e54]:
          - generic "CINEAST" [ref=e55]:
            - img [ref=e56]
          - generic [ref=e57]: Cinema in Focus
        - generic [ref=e58]:
          - generic [ref=e59]: SHARING THE DETAILS THAT ECHO THE FOOTSTEPS OF FILM
          - generic [ref=e61]: SHARING THE DETAILS THAT ECHO THE FOOTSTEPS OF FILM
          - generic [ref=e63]: SHARING THE DETAILS THAT ECHO THE FOOTSTEPS OF FILM
          - generic [ref=e65]: SHARING THE DETAILS THAT ECHO THE FOOTSTEPS OF FILM
    - region "Cinema quote feed" [ref=e67]:
      - generic [ref=e68]:
        - generic [ref=e69]: QUOTE FEED / MOVIE + YEAR
        - generic "Famous movie quote feed" [ref=e70]:
          - generic [ref=e71]:
            - text: SHARING THE DETAILS THAT ECHO THE FOOTSTEPS OF FILM
            - text: "\"Frankly, my dear, I don't give a damn.\" - Gone with the Wind (1939)"
            - text: "\"I'm gonna make him an offer he can't refuse.\" - The Godfather (1972)"
            - text: "\"Here's looking at you, kid.\" - Casablanca (1942)"
            - text: "\"May the Force be with you.\" - Star Wars (1977)"
            - text: "\"Go ahead, make my day.\" - Sudden Impact (1983)"
            - text: "\"I'll be back.\" - The Terminator (1984)"
            - text: "\"You talking to me?\" - Taxi Driver (1976)"
            - text: "\"There's no place like home.\" - The Wizard of Oz (1939)"
            - text: "\"Show me the money!\" - Jerry Maguire (1996)"
            - text: "\"I'm walking here!\" - Midnight Cowboy (1969)"
            - text: "\"Nobody's perfect.\" - Some Like It Hot (1959)"
            - text: "\"After all, tomorrow is another day!\" - Gone with the Wind (1939)"
            - text: "\"It's finger-lickin' GOOD!\" - Near Dark (1987)"
            - text: "\"I hate 'em when they ain't been shaved.\" - Near Dark (1987)"
          - generic [ref=e87]:
            - text: SHARING THE DETAILS THAT ECHO THE FOOTSTEPS OF FILM
            - text: "\"Frankly, my dear, I don't give a damn.\" - Gone with the Wind (1939)"
            - text: "\"I'm gonna make him an offer he can't refuse.\" - The Godfather (1972)"
            - text: "\"Here's looking at you, kid.\" - Casablanca (1942)"
            - text: "\"May the Force be with you.\" - Star Wars (1977)"
            - text: "\"Go ahead, make my day.\" - Sudden Impact (1983)"
            - text: "\"I'll be back.\" - The Terminator (1984)"
            - text: "\"You talking to me?\" - Taxi Driver (1976)"
            - text: "\"There's no place like home.\" - The Wizard of Oz (1939)"
            - text: "\"Show me the money!\" - Jerry Maguire (1996)"
            - text: "\"I'm walking here!\" - Midnight Cowboy (1969)"
            - text: "\"Nobody's perfect.\" - Some Like It Hot (1959)"
            - text: "\"After all, tomorrow is another day!\" - Gone with the Wind (1939)"
            - text: "\"It's finger-lickin' GOOD!\" - Near Dark (1987)"
            - text: "\"I hate 'em when they ain't been shaved.\" - Near Dark (1987)"
    - generic [ref=e105]:
      - img [ref=e107] [cursor=pointer]
      - textbox "SEARCH MICHAEL MANN, NOIR, ROAD MOVIES..." [ref=e110]
    - generic [ref=e112]:
      - generic [ref=e113]:
        - generic [ref=e114]: INTRO /
        - generic [ref=e116]: A NOTE ON THE SCENE
      - generic [ref=e117]:
        - heading "CINEAST is an ode to the in-between. The half-remembered. The unseen. The beauty found in light, shadow, and time." [level=2] [ref=e118]:
          - text: CINEAST is an ode to the in-between.
          - text: The half-remembered. The unseen.
          - text: The beauty found in light, shadow, and time.
        - paragraph [ref=e119]:
          - text: WE DESIGN OBJECTS AND EXPERIENCES THAT ECHO THE EMOTIONS OF FILM —
          - text: INTENTIONAL, INTIMATE, AND MADE TO LAST.
        - heading "FADE IN" [level=2] [ref=e120]
        - paragraph [ref=e121]:
          - text: The opening sequence.
          - text: Minimal staples for midnight minds.
      - generic [ref=e122]:
        - generic [ref=e128]: "001"
        - generic [ref=e129]: BRAND STATEMENT
    - generic [ref=e132]:
      - generic [ref=e133]: INTRO / ROAD NOTES
      - heading "Road Notes" [level=2] [ref=e134]
      - paragraph [ref=e135]: CINEAST is a cinematic lifestyle archive — clothing, objects, essays, and film notes for people who watch closely.
      - paragraph [ref=e137]: A long horizon, a quiet lane, and the sense that movement itself can become memory.
      - link "CONTINUE TO NOW SHOWING →" [ref=e138] [cursor=pointer]:
        - /url: "#now-showing"
    - generic [ref=e140]:
      - generic [ref=e141]:
        - generic [ref=e142]:
          - generic [ref=e143]: INTRO / NOW SHOWING
          - heading "Latest & Greatest" [level=2] [ref=e144]
          - paragraph [ref=e146]: A live editorial snapshot of what Cineast is currently watching, reading, listening to, and wearing.
        - generic [ref=e147]:
          - generic [ref=e148]: LAST UPDATED
          - generic [ref=e149]: /
          - generic [ref=e150]: JUL 05, 2026
          - generic [ref=e151]: 22:26
      - generic [ref=e153]:
        - article [ref=e154]:
          - generic [ref=e155]:
            - generic [ref=e156]: "01"
            - generic [ref=e157]: NOW WATCHING
          - generic [ref=e158]:
            - img "Rainy city street at night" [ref=e159]
            - button "Share card" [ref=e160] [cursor=pointer]:
              - img [ref=e162]
          - generic [ref=e164]:
            - generic [ref=e165]: FILM
            - heading "The Long Walk Home" [level=3] [ref=e166]
            - paragraph [ref=e167]: Dir. J. Mercer • 2026
            - paragraph [ref=e169]: A quiet character study shot on 16mm. Rain, neon, and the spaces in between.
          - generic [ref=e170]:
            - link "OPEN NOTE →" [ref=e171] [cursor=pointer]:
              - /url: "#journal"
            - generic [ref=e172]: 48 MIN IN
        - article [ref=e173]:
          - generic [ref=e174]:
            - generic [ref=e175]: "02"
            - generic [ref=e176]: NOW READING
          - generic [ref=e177]:
            - img "Close view of a film reel" [ref=e178]
            - button "Share card" [ref=e179] [cursor=pointer]:
              - img [ref=e181]
          - generic [ref=e183]:
            - generic [ref=e184]: ESSAY
            - heading "About Night Windows" [level=3] [ref=e185]
            - paragraph [ref=e186]: Cineast Journal No. 18
            - paragraph [ref=e188]: An essay on looking in, late cities, and the frames we cannot quite see.
          - generic [ref=e189]:
            - link "VIEW SELECTION →" [ref=e190] [cursor=pointer]:
              - /url: "#journal"
            - generic [ref=e191]: 12 MIN READ
        - article [ref=e192]:
          - generic [ref=e193]:
            - generic [ref=e194]: "03"
            - generic [ref=e195]: NOW LISTENING
          - generic [ref=e196]:
            - generic [ref=e197]:
              - img "Quiet room with window light" [ref=e198]
              - button "Share card" [ref=e199] [cursor=pointer]:
                - img [ref=e201]
            - generic [ref=e203]:
              - generic [ref=e204]: SOUNDTRACK
              - strong [ref=e205]: After the Credits
              - generic [ref=e206]: Cineast Curated Mix Vol. IV
          - generic [ref=e208]:
            - generic [ref=e209]: MIX
            - heading "After the Credits, Vol. IV" [level=3] [ref=e210]
            - paragraph [ref=e211]: Cineast Curated Mix
            - paragraph [ref=e213]: A late night mix for the walk home. Minimal score, library music, and tape warmth.
          - generic [ref=e214]:
            - link "LISTEN NOW →" [ref=e215] [cursor=pointer]:
              - /url: "#shorts"
            - generic [ref=e216]: 32 MIN
        - article [ref=e217]:
          - generic [ref=e218]:
            - generic [ref=e219]: "04"
            - generic [ref=e220]: NOW WEARING
          - generic [ref=e221]:
            - img "Black Cineast hoodie" [ref=e222]
            - button "Share card" [ref=e223] [cursor=pointer]:
              - img [ref=e225]
          - generic [ref=e227]:
            - generic [ref=e228]: APPAREL
            - heading "Archivist Hoodie" [level=3] [ref=e229]
            - paragraph [ref=e230]: Black • Heavyweight Fleece
            - paragraph [ref=e232]: A core layer for late nights and early calls. Limited run.
          - generic [ref=e233]:
            - link "EXPLORE DROP →" [ref=e234] [cursor=pointer]:
              - /url: "#shop"
            - generic [ref=e235]: LIMITED RUN
      - generic [ref=e236]:
        - generic [ref=e237]: C
        - paragraph [ref=e238]: CINEMATIC LIFESTYLE. QUIETLY OBSERVANT. MADE TO LAST.
        - link "VIEW ALL NOTES →" [ref=e239] [cursor=pointer]:
          - /url: "#now-showing-notes-drawer"
    - generic [ref=e242]:
      - heading "Scene Studies" [level=2] [ref=e243]
      - generic [ref=e244]: CLOSE READINGS OF MOMENTS THAT STAY WITH US.
    - generic [ref=e245]:
      - generic [ref=e247]:
        - generic [ref=e248]:
          - generic [ref=e249]: SHOP / NOW SHOWING
          - heading "The Cineast Shop." [level=1] [ref=e250]
          - paragraph [ref=e252]: Cinematic staples, timeless objects, and limited editions for people who notice the in-between.
          - paragraph [ref=e253]: Curated for the observant. Made to last.
        - generic [ref=e254]:
          - generic [ref=e255]: FEATURED COLLECTION
          - heading "FADE IN" [level=2] [ref=e256]
          - paragraph [ref=e257]: A study in contrast. Essentials for late nights and early ideas.
          - link "EXPLORE COLLECTION →" [ref=e258] [cursor=pointer]:
            - /url: "#shop"
      - generic [ref=e259]:
        - generic [ref=e261]:
          - link "ALL" [ref=e262] [cursor=pointer]:
            - /url: "#shop"
          - link "APPAREL" [ref=e263] [cursor=pointer]:
            - /url: "#shop"
          - link "OBJECTS" [ref=e264] [cursor=pointer]:
            - /url: "#shop"
          - link "EDITIONS" [ref=e265] [cursor=pointer]:
            - /url: "#shop"
          - link "NEW ARRIVALS" [ref=e266] [cursor=pointer]:
            - /url: "#shop"
        - generic [ref=e267]:
          - link "Add Cineast Logo Tee to cart" [ref=e268] [cursor=pointer]:
            - /url: "#cart-drawer"
            - generic [ref=e269]:
              - img "Cineast Logo Tee" [ref=e270]
              - img [ref=e272]
            - generic [ref=e275]:
              - generic [ref=e276]: APPAREL
              - heading "Cineast Logo Tee" [level=3] [ref=e277]
              - generic [ref=e278]:
                - generic [ref=e279]: $48.00
                - generic [ref=e280]:
                  - generic [ref=e281]:
                    - generic [ref=e282]: Noir Black
                    - generic [ref=e283]: Screen Cream
                  - button "BUY" [ref=e284]
          - link "Add Notes on the Scene Tee to cart" [ref=e285] [cursor=pointer]:
            - /url: "#cart-drawer"
            - generic [ref=e286]:
              - img "Notes on the Scene Tee" [ref=e287]
              - img [ref=e289]
            - generic [ref=e292]:
              - generic [ref=e293]: APPAREL
              - heading "Notes on the Scene Tee" [level=3] [ref=e294]
              - generic [ref=e295]:
                - generic [ref=e296]: $48.00
                - generic [ref=e297]:
                  - generic [ref=e298]:
                    - generic [ref=e299]: Screen Cream
                    - generic [ref=e300]: Field Green
                    - generic [ref=e301]: Noir Black
                  - button "BUY" [ref=e302]
          - link "Add Midnight Hoodie to cart" [ref=e303] [cursor=pointer]:
            - /url: "#cart-drawer"
            - generic [ref=e304]:
              - img "Midnight Hoodie" [ref=e305]
              - img [ref=e307]
            - generic [ref=e310]:
              - generic [ref=e311]: APPAREL
              - heading "Midnight Hoodie" [level=3] [ref=e312]
              - generic [ref=e313]:
                - generic [ref=e314]: $78.00
                - generic [ref=e315]:
                  - generic [ref=e316]:
                    - generic [ref=e317]: Noir Black
                    - generic [ref=e318]: Oxblood
                    - generic [ref=e319]: Field Green
                  - button "BUY" [ref=e320]
          - link "Add Cineast Cap to cart" [ref=e321] [cursor=pointer]:
            - /url: "#cart-drawer"
            - generic [ref=e322]:
              - img "Cineast Cap" [ref=e323]
              - img [ref=e325]
            - generic [ref=e328]:
              - generic [ref=e329]: APPAREL
              - heading "Cineast Cap" [level=3] [ref=e330]
              - generic [ref=e331]:
                - generic [ref=e332]: $38.00
                - generic [ref=e333]:
                  - generic [ref=e334]:
                    - generic [ref=e335]: Noir Black
                    - generic [ref=e336]: Field Green
                  - button "BUY" [ref=e337]
          - generic [ref=e338]:
            - generic [ref=e339]: SCENE 02
            - heading "Midnight Screening" [level=2] [ref=e340]:
              - text: Midnight
              - text: Screening
            - paragraph [ref=e342]: A limited drop for the ones who stay for the second feature.
            - link "LIMITED DROP" [ref=e343] [cursor=pointer]:
              - /url: "#shop"
          - link "Add Carry the Scene Tote to cart" [ref=e344] [cursor=pointer]:
            - /url: "#cart-drawer"
            - generic [ref=e345]:
              - img "Carry the Scene Tote" [ref=e346]
              - img [ref=e348]
            - generic [ref=e351]:
              - generic [ref=e352]: OBJECT
              - heading "Carry the Scene Tote" [level=3] [ref=e353]
              - generic [ref=e354]:
                - generic [ref=e355]: $36.00
                - generic [ref=e356]:
                  - generic [ref=e357]:
                    - generic [ref=e358]: Noir Black
                    - generic [ref=e359]: Screen Cream
                  - button "BUY" [ref=e360]
          - link "Add Black Mug to cart" [ref=e361] [cursor=pointer]:
            - /url: "#cart-drawer"
            - generic [ref=e362]:
              - img "Black Mug" [ref=e363]
              - img [ref=e365]
            - generic [ref=e368]:
              - generic [ref=e369]: OBJECT
              - heading "Black Mug" [level=3] [ref=e370]
              - generic [ref=e371]:
                - generic [ref=e372]: $28.00
                - generic [ref=e373]:
                  - generic [ref=e375]: Noir Black
                  - button "BUY" [ref=e376]
          - link "Add Scene Journal to cart" [ref=e377] [cursor=pointer]:
            - /url: "#cart-drawer"
            - generic [ref=e378]:
              - img "Scene Journal" [ref=e379]
              - img [ref=e381]
            - generic [ref=e384]:
              - generic [ref=e385]: OBJECT
              - heading "Scene Journal" [level=3] [ref=e386]
              - generic [ref=e387]:
                - generic [ref=e388]: $32.00
                - generic [ref=e389]:
                  - generic [ref=e390]:
                    - generic [ref=e391]: Noir Black
                    - generic [ref=e392]: Oxblood
                  - button "BUY" [ref=e393]
          - link "Add Tonight We Disappear Print to cart" [ref=e394] [cursor=pointer]:
            - /url: "#cart-drawer"
            - generic [ref=e395]:
              - img "Tonight We Disappear Print" [ref=e396]
              - img [ref=e398]
            - generic [ref=e401]:
              - generic [ref=e402]: EDITIONS
              - heading "Tonight We Disappear Print" [level=3] [ref=e403]
              - generic [ref=e404]:
                - generic [ref=e405]: $55.00
                - generic [ref=e406]:
                  - generic [ref=e407]: ARCHIVE ITEM
                  - button "BUY" [ref=e408]
          - link "Add Film Reel Canister to cart" [ref=e409] [cursor=pointer]:
            - /url: "#cart-drawer"
            - generic [ref=e410]:
              - img "Film Reel Canister" [ref=e411]
              - img [ref=e413]
            - generic [ref=e416]:
              - generic [ref=e417]: OBJECT
              - heading "Film Reel Canister" [level=3] [ref=e418]
              - generic [ref=e419]:
                - generic [ref=e420]: $26.00
                - generic [ref=e421]:
                  - generic [ref=e422]: ARCHIVE ITEM
                  - button "BUY" [ref=e423]
        - generic [ref=e424]:
          - generic [ref=e425]:
            - img [ref=e427]
            - generic [ref=e430]:
              - generic [ref=e431]: LIMITED RUNS
              - generic [ref=e432]:
                - text: Small batch releases.
                - text: Once they're gone, they're gone.
          - generic [ref=e433]:
            - img [ref=e435]
            - generic [ref=e437]:
              - generic [ref=e438]: ARCHIVE QUALITY
              - generic [ref=e439]:
                - text: Built to be kept, used,
                - text: and passed on.
          - generic [ref=e440]:
            - img [ref=e442]
            - generic [ref=e444]:
              - generic [ref=e445]: WORLDWIDE SHIPPING
              - generic [ref=e446]:
                - text: From our studio to anywhere
                - text: the story goes.
          - generic [ref=e447]:
            - img [ref=e449]
            - generic [ref=e452]:
              - generic [ref=e453]: NOTES ON THE SCENE
              - generic [ref=e454]:
                - text: Every order includes a
                - text: Cineast Journal insert.
          - generic [ref=e456]:
            - generic [ref=e457]: QUESTIONS?
            - link "Contact us" [ref=e458] [cursor=pointer]:
              - /url: mailto:cineast@rynell.org
              - text: Contact us
              - img [ref=e459]
    - generic [ref=e463]:
      - generic [ref=e464]:
        - generic [ref=e465]:
          - generic [ref=e466]: ABOUT / THE STORY OF CINEAST
          - heading "For people who watch closely." [level=2] [ref=e467]:
            - text: For people
            - text: who watch closely.
          - paragraph [ref=e469]: Cineast is a cinematic lifestyle label built around mood, framing, memory, and the art of the scene. It brings together clothing, objects, and editorial storytelling for people drawn to light, silence, grain, and the beauty of the in-between.
          - paragraph [ref=e470]:
            - text: A fashion label crossed with an arthouse film journal.
            - text: Quiet, observant, and made to last.
        - generic [ref=e471]:
          - img "Street scene" [ref=e473]
          - generic [ref=e474]:
            - img "Journal" [ref=e476]
            - img "Film" [ref=e478]
      - generic [ref=e479]:
        - generic [ref=e480]:
          - generic [ref=e481]: BRAND MOOD
          - generic [ref=e482]:
            - text: CINEMATIC
            - text: EDITORIAL
            - text: MOODY
            - text: INTELLIGENT
            - text: MINIMAL
        - generic [ref=e483]:
          - generic [ref=e484]: KEYWORDS
          - generic [ref=e485]:
            - text: FRAME / STILL / GRAIN /
            - text: SUBTITLE / SEQUENCE /
            - text: MIDNIGHT / ARCHIVE /
            - text: MEMORY
        - generic [ref=e486]:
          - generic [ref=e487]: THOUGHT
          - generic [ref=e488]:
            - text: A website that feels like
            - text: a quiet opening scene.
        - generic [ref=e489]:
          - generic [ref=e490]: COLOR PALETTE
          - generic [ref=e491]:
            - generic [ref=e494]:
              - text: PROJECTION
              - text: BLACK
              - text: "#0A0A0A"
            - generic [ref=e497]:
              - text: SCREEN
              - text: CREAM
              - text: "#F2EEE8"
            - generic [ref=e500]:
              - text: DUST
              - text: GRAY
              - text: "#8A8781"
            - generic [ref=e503]:
              - text: SILVER
              - text: REEL
              - text: "#C6C2BB"
            - generic [ref=e506]:
              - text: OXBLOOD
              - text: "#5B1F26"
            - generic [ref=e509]:
              - text: PROJECTOR
              - text: AMBER
              - text: "#C58B45"
            - generic [ref=e512]:
              - text: CINEMA
              - text: NAVY
              - text: "#121A26"
            - generic [ref=e515]:
              - text: MUTED
              - text: OLIVE
              - text: "#5E6658"
      - generic [ref=e516]:
        - generic [ref=e517]:
          - generic [ref=e518]: TYPOGRAPHY
          - generic [ref=e519]:
            - generic [ref=e520]:
              - text: Aa
              - generic [ref=e521]: EDITORIAL SERIF
            - generic [ref=e522]:
              - text: Aa
              - generic [ref=e523]: CLEAN GROTESK
            - generic [ref=e524]:
              - text: A A
              - generic [ref=e525]: UTILITY MONO
        - link "ENTER THE ARCHIVE →" [ref=e527] [cursor=pointer]:
          - /url: "#shop"
    - generic [ref=e529]:
      - generic [ref=e530]:
        - heading "RECENT STORIES" [level=2] [ref=e531]
        - list [ref=e532]:
          - listitem [ref=e533]:
            - button "ALL HQS" [ref=e534] [cursor=pointer]
          - listitem [ref=e535]:
            - button "TRAILERS" [ref=e536] [cursor=pointer]
          - listitem [ref=e537]:
            - button "FESTIVALS" [ref=e538] [cursor=pointer]
          - listitem [ref=e539]:
            - button "RETROSPECTIVES" [ref=e540] [cursor=pointer]
          - listitem [ref=e541]:
            - button "INDIES" [ref=e542] [cursor=pointer]
      - generic [ref=e543]:
        - article [ref=e544]:
          - generic [ref=e545]:
            - img "BUGONIA | Official Teaser | Yorgos Lanthimos" [ref=e546]
            - generic "Play Video" [ref=e548]:
              - img [ref=e549]
            - generic [ref=e551]: OFFICIAL TEASER
          - generic [ref=e552]:
            - generic [ref=e553]:
              - img "Focus Features & A24" [ref=e555]
              - generic [ref=e556]: Focus Features & A24
            - heading "BUGONIA | Official Teaser | Yorgos Lanthimos" [level=3] [ref=e557]
            - paragraph [ref=e558]: Yorgos Lanthimos returns with Emma Stone and Jesse Plemons in a darkly comedic conspiracy thriller following two young men who kidnap a corporate CEO, convinced she is an alien intending to destroy Earth.
            - link "READ STORY →" [ref=e560] [cursor=pointer]:
              - /url: https://letterboxd.com/film/bugonia/
        - article [ref=e561]:
          - generic [ref=e562]:
            - img "THE BRUTALIST | Official Trailer | Now Streaming & In Theaters" [ref=e563]
            - generic "Play Video" [ref=e565]:
              - img [ref=e566]
            - generic [ref=e568]: OFFICIAL TRAILER
          - generic [ref=e569]:
            - generic [ref=e570]:
              - img "A24" [ref=e572]
              - generic [ref=e573]: A24
            - heading "THE BRUTALIST | Official Trailer | Now Streaming & In Theaters" [level=3] [ref=e574]
            - paragraph [ref=e575]: Adrien Brody stars in Brady Corbet’s Venice Silver Lion winner tracking thirty years in the life of Hungarian-Jewish architect László Toth as he emigrates to post-war America and lands an extraordinary commission.
            - link "READ STORY →" [ref=e577] [cursor=pointer]:
              - /url: https://a24films.com/
        - article [ref=e578]:
          - generic [ref=e579]:
            - img "SINNERS | Official Trailer | Ryan Coogler & Michael B. Jordan" [ref=e580]
            - generic "Play Video" [ref=e582]:
              - img [ref=e583]
            - generic [ref=e585]: OFFICIAL TRAILER
          - generic [ref=e586]:
            - generic [ref=e587]:
              - img "Warner Bros. Pictures" [ref=e589]
              - generic [ref=e590]: Warner Bros. Pictures
            - heading "SINNERS | Official Trailer | Ryan Coogler & Michael B. Jordan" [level=3] [ref=e591]
            - paragraph [ref=e592]: Trying to leave their troubled lives behind, twin brothers return to their Southern hometown to start again, only to discover that an even greater evil is waiting to welcome them back.
            - link "READ STORY →" [ref=e594] [cursor=pointer]:
              - /url: https://www.sinnersmovie.com/
        - article [ref=e595]:
          - generic [ref=e596]:
            - img "APRIL | Official Trailer | Now Streaming" [ref=e597]
            - generic "Play Video" [ref=e599]:
              - img [ref=e600]
            - generic [ref=e602]: OFFICIAL TRAILER
          - generic [ref=e603]:
            - generic [ref=e604]:
              - img "MUBI" [ref=e606]
              - generic [ref=e607]: MUBI
            - heading "APRIL | Official Trailer | Now Streaming" [level=3] [ref=e608]
            - paragraph [ref=e609]: APRIL. Winner of the Venice Special Jury Prize in 2024, Georgian filmmaker Dea Kulumbegashvili (Beginning) gives us a film about the morals and professionalism of Nina, an obstetrician-gynecologist who comes under scrutiny after a newborn dies during delivery and her work helping women in villages with abortions.
            - link "READ STORY →" [ref=e611] [cursor=pointer]:
              - /url: https://mubi.com/
        - article [ref=e612]:
          - generic [ref=e613]:
            - img "28 YEARS LATER | Official Teaser | Danny Boyle & Alex Garland" [ref=e614]
            - generic "Play Video" [ref=e616]:
              - img [ref=e617]
            - generic [ref=e619]: OFFICIAL TEASER
          - generic [ref=e620]:
            - generic [ref=e621]:
              - img "Sony Pictures" [ref=e623]
              - generic [ref=e624]: Sony Pictures
            - heading "28 YEARS LATER | Official Teaser | Danny Boyle & Alex Garland" [level=3] [ref=e625]
            - paragraph [ref=e626]: Danny Boyle and Alex Garland reunite for the long-awaited continuation of the groundbreaking post-apocalyptic saga, starring Cillian Murphy, Jodie Comer, and Aaron Taylor-Johnson.
            - link "READ STORY →" [ref=e628] [cursor=pointer]:
              - /url: https://www.sonypictures.com/
        - article [ref=e629]:
          - generic [ref=e630]:
            - 'img "Play Today’s Game #1587" [ref=e631]'
            - generic [ref=e632]: "?"
            - generic [ref=e633]: Get the Picture
          - generic [ref=e634]:
            - generic [ref=e635]:
              - img "AFI" [ref=e637]
              - generic [ref=e638]: AFI
            - 'heading "Play Today’s Game #1587" [level=3] [ref=e639]'
            - paragraph [ref=e640]: Guess this movie image! Track your Get the Picture play and win streaks and challenge yourself with past games.
            - link "READ STORY →" [ref=e642] [cursor=pointer]:
              - /url: https://www.afi.com/
        - article [ref=e643]:
          - generic [ref=e644]:
            - 'img "Sculpting in Time: Andrei Tarkovsky" [ref=e645]'
            - generic "Play Video" [ref=e647]:
              - img [ref=e648]
          - generic [ref=e650]:
            - generic [ref=e651]:
              - img "DCA Cinema" [ref=e653]
              - generic [ref=e654]: DCA Cinema
            - 'heading "Sculpting in Time: Andrei Tarkovsky" [level=3] [ref=e655]'
            - paragraph [ref=e656]: David Nixon, DCA’s Head of Cinema, shares more about our Andrei Tarkovsky season, taking place throughout August.
            - link "READ STORY →" [ref=e658] [cursor=pointer]:
              - /url: https://www.dca.org.uk/
        - article [ref=e659]:
          - generic [ref=e660]:
            - img "DFF49 Passes Are On Sale!" [ref=e661]
            - generic [ref=e662]: OCTOBER 22 - NOVEMBER 1
          - generic [ref=e663]:
            - generic [ref=e664]:
              - img "Denver Film" [ref=e666]
              - generic [ref=e667]: Denver Film
            - heading "DFF49 Passes Are On Sale!" [level=3] [ref=e668]
            - paragraph [ref=e669]: However you DFF, it all starts with a pass. From first-time festivalgoers to seasoned cinephiles and red carpet regulars, there's a pass designed to unlock your perfect festival experience. Find yours today and let the countdown begin.
            - link "READ STORY →" [ref=e671] [cursor=pointer]:
              - /url: https://www.denverfilm.org/
        - article [ref=e672]:
          - generic [ref=e673]:
            - img "Queerfilmfestival 2026" [ref=e674]
            - generic "Play Video" [ref=e676]:
              - img [ref=e677]
            - generic [ref=e679]: QUEER FILM FESTIVAL
          - generic [ref=e680]:
            - generic [ref=e681]:
              - img "Votiv Kino & Kino de France" [ref=e683]
              - generic [ref=e684]: Votiv Kino & Kino de France
            - heading "Queerfilmfestival 2026" [level=3] [ref=e685]
            - paragraph [ref=e686]: Vom 10. bis 16. September 2026 zeigt das Votiv Kino gemeinsam mit dem Kino De France wieder die ganze Bandbreite des internationalen queeren Kinos. Mit insgesamt 20 Premieren erwarten das Publikum eine Vielzahl queerer Geschichten und Perspektiven ergänzt durch Filmgespräche im Anschluss.
            - link "READ STORY →" [ref=e688] [cursor=pointer]:
              - /url: https://www.votivkino.at/
        - article [ref=e689]:
          - generic [ref=e690]:
            - 'img "‘The Perfect Neighbor’: A Documentary Ethics Case Study" [ref=e691]'
            - generic "Play Video" [ref=e693]:
              - img [ref=e694]
            - generic [ref=e696]: DOCUMENTARY ETHICS
          - generic [ref=e697]:
            - generic [ref=e698]:
              - img "Film Independent" [ref=e700]
              - generic [ref=e701]: Film Independent
            - 'heading "‘The Perfect Neighbor’: A Documentary Ethics Case Study" [level=3] [ref=e702]'
            - paragraph [ref=e703]: Filmmaker Tuesday case study on documentary ethics, exploring filmmaker responsibilities when representing complex non-fiction subjects and maintaining narrative integrity.
            - link "READ STORY →" [ref=e705] [cursor=pointer]:
              - /url: https://www.filmindependent.org/
        - article [ref=e706]:
          - generic [ref=e707]:
            - img "Restoring Powell & Pressburger’s Visionary Cinema" [ref=e708]
            - generic [ref=e709]: 4K RESTORATION
          - generic [ref=e710]:
            - generic [ref=e711]:
              - img "BFI National Archive" [ref=e713]
              - generic [ref=e714]: BFI National Archive
            - heading "Restoring Powell & Pressburger’s Visionary Cinema" [level=3] [ref=e715]
            - paragraph [ref=e716]: The BFI National Archive unveils immaculate new 4K digital restorations of classic British Technicolor masterpieces, preserved for future generations of cinephiles worldwide.
            - link "READ STORY →" [ref=e718] [cursor=pointer]:
              - /url: https://www.bfi.org.uk/
        - article [ref=e719]:
          - generic [ref=e720]:
            - img "TIFF 2026 Special Presentations Lineup Announced" [ref=e721]
            - generic "Play Video" [ref=e723]:
              - img [ref=e724]
            - generic [ref=e726]: FESTIVAL LINEUP
          - generic [ref=e727]:
            - generic [ref=e728]:
              - img "TIFF" [ref=e730]
              - generic [ref=e731]: TIFF
            - heading "TIFF 2026 Special Presentations Lineup Announced" [level=3] [ref=e732]
            - paragraph [ref=e733]: Toronto International Film Festival announces its world premieres featuring groundbreaking auteur cinema, high-profile galas, and visionary international discoveries.
            - link "READ STORY →" [ref=e735] [cursor=pointer]:
              - /url: https://tiff.net/
        - article [ref=e736]:
          - generic [ref=e737]:
            - img "New Perspectives in Contemporary European Auteur Cinema" [ref=e738]
            - generic [ref=e739]: ESSAY & CRITICISM
          - generic [ref=e740]:
            - generic [ref=e741]:
              - img "Cahiers du Cinéma" [ref=e743]
              - generic [ref=e744]: Cahiers du Cinéma
            - heading "New Perspectives in Contemporary European Auteur Cinema" [level=3] [ref=e745]
            - paragraph [ref=e746]: An in-depth critical reflection on how contemporary French and international filmmakers are challenging narrative form, light, and temporality in 2026.
            - link "READ STORY →" [ref=e748] [cursor=pointer]:
              - /url: https://www.cahiersducinema.com/
    - generic [ref=e750]:
      - generic [ref=e751]:
        - heading "FROM THE JOURNAL" [level=2] [ref=e752]
        - generic [ref=e753]: ISSUE 05 / MAY 28, 2024
      - generic [ref=e754]:
        - link "The Bridges of Madison County collage Share card JOURNAL ENTRY 004 Romance the Ordinary 4 MIN READ / MIDNIGHT NOTES / VISUAL ESSAY Notes on slowing down, paying attention, and finding beauty in the everyday. READ ENTRY 004 →" [ref=e755] [cursor=pointer]:
          - /url: /article.html?id=004
          - generic [ref=e756]:
            - img "The Bridges of Madison County collage" [ref=e757]
            - button "Share card" [ref=e759]:
              - img [ref=e761]
          - generic [ref=e763]:
            - generic [ref=e764]: JOURNAL ENTRY 004
            - heading "Romance the Ordinary" [level=3] [ref=e765]
            - generic [ref=e766]: 4 MIN READ / MIDNIGHT NOTES / VISUAL ESSAY
            - paragraph [ref=e767]: Notes on slowing down, paying attention, and finding beauty in the everyday.
            - generic [ref=e768]: READ ENTRY 004 →
        - generic [ref=e769]:
          - link "Film reel Share card JOURNAL ENTRY 003 On Grain and Patience 3 MIN READ / OBSERVATIONS / VISUAL ESSAY Grain is more than texture—it's time made visible. →" [ref=e770] [cursor=pointer]:
            - /url: /article.html?id=003
            - generic [ref=e771]:
              - img "Film reel" [ref=e772]
              - button "Share card" [ref=e773]:
                - img [ref=e775]
            - generic [ref=e777]:
              - generic [ref=e778]: JOURNAL ENTRY 003
              - heading "On Grain and Patience" [level=4] [ref=e779]
              - generic [ref=e780]: 3 MIN READ / OBSERVATIONS / VISUAL ESSAY
              - paragraph [ref=e781]: Grain is more than texture—it's time made visible.
              - generic [ref=e782]: →
          - link "Quiet room Share card JOURNAL ENTRY 002 The Beauty of Slow Scenes 5 MIN READ / NOTES / VISUAL ESSAY Slowness creates space for feeling. The frame holds what rushing loses. →" [ref=e783] [cursor=pointer]:
            - /url: /article.html?id=002
            - generic [ref=e784]:
              - img "Quiet room" [ref=e785]
              - button "Share card" [ref=e786]:
                - img [ref=e788]
            - generic [ref=e790]:
              - generic [ref=e791]: JOURNAL ENTRY 002
              - heading "The Beauty of Slow Scenes" [level=4] [ref=e792]
              - generic [ref=e793]: 5 MIN READ / NOTES / VISUAL ESSAY
              - paragraph [ref=e794]: Slowness creates space for feeling. The frame holds what rushing loses.
              - generic [ref=e795]: →
          - link "Empty street Share card JOURNAL ENTRY 001 City Light, Late Night 4 MIN READ / MIDNIGHT NOTES / PHOTO ESSAY Thoughts on walking home when the city exhales. →" [ref=e796] [cursor=pointer]:
            - /url: /article.html?id=001
            - generic [ref=e797]:
              - img "Empty street" [ref=e798]
              - button "Share card" [ref=e799]:
                - img [ref=e801]
            - generic [ref=e803]:
              - generic [ref=e804]: JOURNAL ENTRY 001
              - heading "City Light, Late Night" [level=4] [ref=e805]
              - generic [ref=e806]: 4 MIN READ / MIDNIGHT NOTES / PHOTO ESSAY
              - paragraph [ref=e807]: Thoughts on walking home when the city exhales.
              - generic [ref=e808]: →
      - generic [ref=e809]:
        - generic [ref=e810]: NEW ENTRIES EVERY WEEK.
        - generic [ref=e811]: SHARING THE DETAILS THAT ECHO THE FOOTSTEPS OF FILM.
    - generic [ref=e812]:
      - generic [ref=e814]:
        - generic [ref=e815]:
          - 'heading "Feed of #shorts" [level=2] [ref=e816]'
          - generic [ref=e817]:
            - button "Filter Facebook" [ref=e818] [cursor=pointer]:
              - img [ref=e819]
            - button "Filter Letterboxd" [ref=e821] [cursor=pointer]:
              - img [ref=e822]
        - generic [ref=e826]: ARCHIVE NOTES
      - generic [ref=e828]:
        - article [ref=e829] [cursor=pointer]:
          - generic [ref=e830]:
            - img [ref=e832]
            - img "Bugonia, 2025 - ★★★★½..." [ref=e836]
          - generic [ref=e837]:
            - generic [ref=e838]: NOV 16, 2025
            - heading "Bugonia, 2025 - ★★★★½..." [level=4] [ref=e839]
            - paragraph [ref=e840]: Just saying. I’m totally blown away.Bugonia delivers yet another powerhouse performance...
        - article [ref=e841] [cursor=pointer]:
          - generic [ref=e842]:
            - img [ref=e844]
            - 'img "Mission: Impossible – The..." [ref=e848]'
          - generic [ref=e849]:
            - generic [ref=e850]: OCT 31, 2025
            - 'heading "Mission: Impossible – The..." [level=4] [ref=e851]'
            - paragraph [ref=e852]: Final Reckoning, 2025 - ★★★½ Watched on Wednesday October 29, 2025.
        - article [ref=e853] [cursor=pointer]:
          - generic [ref=e854]:
            - img [ref=e856]
            - img "One Battle After Another,..." [ref=e860]
          - generic [ref=e861]:
            - generic [ref=e862]: OCT 31, 2025
            - heading "One Battle After Another,..." [level=4] [ref=e863]
            - paragraph [ref=e864]: 2025 - ★★★★★ It will not ever be better than this....
        - article [ref=e865] [cursor=pointer]:
          - generic [ref=e866]:
            - img [ref=e868]
            - img "After the Hunt, 2025..." [ref=e872]
          - generic [ref=e873]:
            - generic [ref=e874]: OCT 19, 2025
            - heading "After the Hunt, 2025..." [level=4] [ref=e875]
            - paragraph [ref=e876]: "- ★★ Unfortunately this is not a good experience at all,..."
        - article [ref=e877] [cursor=pointer]:
          - generic [ref=e878]:
            - img [ref=e880]
            - img "The Hitcher, 1986 -..." [ref=e884]
          - generic [ref=e885]:
            - generic [ref=e886]: SEP 28, 2025
            - heading "The Hitcher, 1986 -..." [level=4] [ref=e887]
            - paragraph [ref=e888]: ★★★★★ One of the true masterpieces of eighties action-thrillers. Written by...
        - article [ref=e889] [cursor=pointer]:
          - generic [ref=e890]:
            - img [ref=e892]
            - img "Gladiator II, 2024 -..." [ref=e896]
          - generic [ref=e897]:
            - generic [ref=e898]: SEP 27, 2025
            - heading "Gladiator II, 2024 -..." [level=4] [ref=e899]
            - paragraph [ref=e900]: ★★½ Ridley recreates his old masterpiece with a simple formula, copyright...
        - article [ref=e901] [cursor=pointer]:
          - generic [ref=e902]:
            - img [ref=e904]
            - img "The Brutalist, 2024 -..." [ref=e908]
          - generic [ref=e909]:
            - generic [ref=e910]: SEP 27, 2025
            - heading "The Brutalist, 2024 -..." [level=4] [ref=e911]
            - paragraph [ref=e912]: ★★★ Fascinating, beautiful and gripping drama. Great performances by Felicity Jones,...
        - article [ref=e913] [cursor=pointer]:
          - generic [ref=e914]:
            - img [ref=e916]
            - img "Aliens, 1986 - ★★★★★..." [ref=e920]
          - generic [ref=e921]:
            - generic [ref=e922]: SEP 27, 2025
            - heading "Aliens, 1986 - ★★★★★..." [level=4] [ref=e923]
            - paragraph [ref=e924]: Special Edition of Aliens by J. Cameron. At last a chance...
        - article [ref=e925] [cursor=pointer]:
          - generic [ref=e926]:
            - img [ref=e928]
            - img "Sinners, 2025 - ★★★..." [ref=e932]
          - generic [ref=e933]:
            - generic [ref=e934]: SEP 27, 2025
            - heading "Sinners, 2025 - ★★★..." [level=4] [ref=e935]
            - paragraph [ref=e936]: Interesting take on the old classic Vampire Horror Theme. Really two...
        - article [ref=e937] [cursor=pointer]:
          - generic [ref=e938]:
            - img [ref=e940]
            - img "28 Years Later, 2025..." [ref=e944]
          - generic [ref=e945]:
            - generic [ref=e946]: SEP 27, 2025
            - heading "28 Years Later, 2025..." [level=4] [ref=e947]
            - paragraph [ref=e948]: "- ★★★★ Finally the old masters Boyle & Garland, are back..."
        - article [ref=e949] [cursor=pointer]:
          - generic [ref=e950]:
            - img [ref=e952]
            - img "Superman, 2025 - ★★★½..." [ref=e956]
          - generic [ref=e957]:
            - generic [ref=e958]: SEP 27, 2025
            - heading "Superman, 2025 - ★★★½..." [level=4] [ref=e959]
            - paragraph [ref=e960]: Great comeback! Back to the old, proven strong values and a...
        - article [ref=e961] [cursor=pointer]:
          - generic [ref=e962]:
            - img [ref=e964]
            - img "Weapons, 2025 - ★★★★..." [ref=e968]
          - generic [ref=e969]:
            - generic [ref=e970]: SEP 27, 2025
            - heading "Weapons, 2025 - ★★★★..." [level=4] [ref=e971]
            - paragraph [ref=e972]: Scary as hell, and funny actually. Love this small town drama...
        - article [ref=e973] [cursor=pointer]:
          - generic [ref=e974]:
            - img [ref=e976]
            - img "The Long Walk, 2025..." [ref=e980]
          - generic [ref=e981]:
            - generic [ref=e982]: SEP 27, 2025
            - heading "The Long Walk, 2025..." [level=4] [ref=e983]
            - paragraph [ref=e984]: "- ★★★½ Interesting Stephen King adaption. Great and Gripping, very violent...."
        - article [ref=e985] [cursor=pointer]:
          - generic [ref=e986]:
            - img [ref=e988]
            - 'img "The Conjuring: Last Rites,..." [ref=e992]'
          - generic [ref=e993]:
            - generic [ref=e994]: SEP 27, 2025
            - 'heading "The Conjuring: Last Rites,..." [level=4] [ref=e995]'
            - paragraph [ref=e996]: 2025 - ★★★½ Watched on Friday September 19, 2025.
        - article [ref=e997] [cursor=pointer]:
          - generic [ref=e998]:
            - img [ref=e1000]
            - img "It Follows, 2014 -..." [ref=e1004]
          - generic [ref=e1005]:
            - generic [ref=e1006]: DEC 13, 2019
            - heading "It Follows, 2014 -..." [level=4] [ref=e1007]
            - paragraph [ref=e1008]: ★★★ Watched on Saturday December 12, 2015.
        - article [ref=e1009] [cursor=pointer]:
          - generic [ref=e1010]:
            - img [ref=e1012]
            - img "Masterpieces" [ref=e1016]
          - generic [ref=e1017]:
            - generic [ref=e1018]: MAR 19, 2019
            - heading "Masterpieces" [level=4] [ref=e1019]
            - paragraph
        - article [ref=e1020] [cursor=pointer]:
          - generic [ref=e1021]:
            - img [ref=e1023]
            - img "The Waterdance, 1992 -..." [ref=e1027]
          - generic [ref=e1028]:
            - generic [ref=e1029]: MAR 05, 2019
            - heading "The Waterdance, 1992 -..." [level=4] [ref=e1030]
            - paragraph [ref=e1031]: ★★★★ A pure joy and a gem of a movie, fond...
        - article [ref=e1032] [cursor=pointer]:
          - generic [ref=e1033]:
            - img [ref=e1035]
            - img "Deliverance, 1972 - ★★★★★..." [ref=e1039]
          - generic [ref=e1040]:
            - generic [ref=e1041]: FEB 08, 2019
            - heading "Deliverance, 1972 - ★★★★★..." [level=4] [ref=e1042]
            - paragraph [ref=e1043]: A true classic and one film so true to the seventies...
        - article [ref=e1044] [cursor=pointer]:
          - generic [ref=e1045]:
            - img [ref=e1047]
            - img "Forty years today... in..." [ref=e1049]
          - generic [ref=e1050]:
            - generic [ref=e1051]: JUL 05, 2026
            - heading "Forty years today... in..." [level=4] [ref=e1052]
            - paragraph [ref=e1053]: the blink of an eye
        - article [ref=e1054] [cursor=pointer]:
          - generic [ref=e1055]:
            - img [ref=e1057]
            - img "Dream On" [ref=e1059]
          - generic [ref=e1060]:
            - generic [ref=e1061]: JUL 05, 2026
            - heading "Dream On" [level=4] [ref=e1062]
            - paragraph
        - article [ref=e1063] [cursor=pointer]:
          - generic [ref=e1064]:
            - img [ref=e1066]
            - img "Archive Photo" [ref=e1068]
          - generic [ref=e1069]:
            - generic [ref=e1070]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1071]
            - paragraph
        - article [ref=e1072] [cursor=pointer]:
          - generic [ref=e1073]:
            - img [ref=e1075]
            - img "Jon Hamm Reacts to..." [ref=e1077]
          - generic [ref=e1078]:
            - generic [ref=e1079]: JUL 05, 2026
            - heading "Jon Hamm Reacts to..." [level=4] [ref=e1080]
            - paragraph [ref=e1081]: His Viral Meme Moment Jon Hamm has shared his reaction after...
        - article [ref=e1082] [cursor=pointer]:
          - generic [ref=e1083]:
            - img [ref=e1085]
            - img "With a world-class cast..." [ref=e1087]
          - generic [ref=e1088]:
            - generic [ref=e1089]: JUL 05, 2026
            - heading "With a world-class cast..." [level=4] [ref=e1090]
            - paragraph [ref=e1091]: that will have you constantly saying ‘hey, it’s that guy!’, this...
        - article [ref=e1092] [cursor=pointer]:
          - generic [ref=e1093]:
            - img [ref=e1095]
            - img "The cast of Mike..." [ref=e1097]
          - generic [ref=e1098]:
            - generic [ref=e1099]: JUL 05, 2026
            - heading "The cast of Mike..." [level=4] [ref=e1100]
            - paragraph [ref=e1101]: "Flanagan’s ‘THE EXORCIST’: • Scarlett Johansson • Jacobi Jupe • Kate..."
        - article [ref=e1102] [cursor=pointer]:
          - generic [ref=e1103]:
            - img [ref=e1105]
            - img "bästa krigsfilmen, om du..." [ref=e1107]
          - generic [ref=e1108]:
            - generic [ref=e1109]: JUL 05, 2026
            - heading "bästa krigsfilmen, om du..." [level=4] [ref=e1110]
            - paragraph [ref=e1111]: gillar "full retard"
        - article [ref=e1112] [cursor=pointer]:
          - generic [ref=e1113]:
            - img [ref=e1115]
            - img "Archive Photo" [ref=e1117]
          - generic [ref=e1118]:
            - generic [ref=e1119]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1120]
            - paragraph
        - article [ref=e1121] [cursor=pointer]:
          - generic [ref=e1122]:
            - img [ref=e1124]
            - img "Sergio!" [ref=e1126]
          - generic [ref=e1127]:
            - generic [ref=e1128]: JUL 05, 2026
            - heading "Sergio!" [level=4] [ref=e1129]
            - paragraph
        - article [ref=e1130] [cursor=pointer]:
          - generic [ref=e1131]:
            - img [ref=e1133]
            - img "Dats true. Full retarded" [ref=e1135]
          - generic [ref=e1136]:
            - generic [ref=e1137]: JUL 05, 2026
            - heading "Dats true. Full retarded" [level=4] [ref=e1138]
            - paragraph
        - article [ref=e1139] [cursor=pointer]:
          - generic [ref=e1140]:
            - img [ref=e1142]
            - img "Så välförtjänt! Det läskigaste..." [ref=e1144]
          - generic [ref=e1145]:
            - generic [ref=e1146]: JUL 05, 2026
            - heading "Så välförtjänt! Det läskigaste..." [level=4] [ref=e1147]
            - paragraph [ref=e1148]: jag sett på bio på riktigt länge, se Weapons! Nu!
        - article [ref=e1149] [cursor=pointer]:
          - generic [ref=e1150]:
            - img [ref=e1152]
            - img "Archive Photo" [ref=e1154]
          - generic [ref=e1155]:
            - generic [ref=e1156]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1157]
            - paragraph
        - article [ref=e1158] [cursor=pointer]:
          - generic [ref=e1159]:
            - img [ref=e1161]
            - img "Wow Ethan Hawke briljerar..." [ref=e1163]
          - generic [ref=e1164]:
            - generic [ref=e1165]: JUL 05, 2026
            - heading "Wow Ethan Hawke briljerar..." [level=4] [ref=e1166]
            - paragraph [ref=e1167]: igen! Visdomsord! Ha en skön helg vänner
        - article [ref=e1168] [cursor=pointer]:
          - generic [ref=e1169]:
            - img [ref=e1171]
            - img "David Cronenberg hated Ridley..." [ref=e1173]
          - generic [ref=e1174]:
            - generic [ref=e1175]: JUL 05, 2026
            - heading "David Cronenberg hated Ridley..." [level=4] [ref=e1176]
            - paragraph [ref=e1177]: "Scott's 'Alien': \"A $300,000 B-movie with a $10million budget.”"
        - article [ref=e1178] [cursor=pointer]:
          - generic [ref=e1179]:
            - img [ref=e1181]
            - img "On this day in..." [ref=e1183]
          - generic [ref=e1184]:
            - generic [ref=e1185]: JUL 05, 2026
            - heading "On this day in..." [level=4] [ref=e1186]
            - paragraph [ref=e1187]: 1984, five students at Shermer High School reported at 7:00 a.m....
        - article [ref=e1188] [cursor=pointer]:
          - generic [ref=e1189]:
            - img [ref=e1191]
            - img "Ryan Gosling and Macaulay..." [ref=e1193]
          - generic [ref=e1194]:
            - generic [ref=e1195]: JUL 05, 2026
            - heading "Ryan Gosling and Macaulay..." [level=4] [ref=e1196]
            - paragraph [ref=e1197]: Culkin T-shirt Inception
        - article [ref=e1198] [cursor=pointer]:
          - generic [ref=e1199]:
            - img [ref=e1201]
            - img "klassiskt 80-tal med ett..." [ref=e1203]
          - generic [ref=e1204]:
            - generic [ref=e1205]: JUL 05, 2026
            - heading "klassiskt 80-tal med ett..." [level=4] [ref=e1206]
            - paragraph [ref=e1207]: av mina gamla favoritband som var väldigt tydliga med ett stort...
        - article [ref=e1208] [cursor=pointer]:
          - generic [ref=e1209]:
            - img [ref=e1211]
            - img "Archive Photo" [ref=e1213]
          - generic [ref=e1214]:
            - generic [ref=e1215]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1216]
            - paragraph
        - article [ref=e1217] [cursor=pointer]:
          - generic [ref=e1218]:
            - img [ref=e1220]
            - img "Detta känns som ett..." [ref=e1222]
          - generic [ref=e1223]:
            - generic [ref=e1224]: JUL 05, 2026
            - heading "Detta känns som ett..." [level=4] [ref=e1225]
            - paragraph [ref=e1226]: riktigt träningspass
        - article [ref=e1227] [cursor=pointer]:
          - generic [ref=e1228]:
            - img [ref=e1230]
            - img "Archive Photo" [ref=e1232]
          - generic [ref=e1233]:
            - generic [ref=e1234]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1235]
            - paragraph
        - article [ref=e1236] [cursor=pointer]:
          - generic [ref=e1237]:
            - img [ref=e1239]
            - img "Archive Photo" [ref=e1241]
          - generic [ref=e1242]:
            - generic [ref=e1243]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1244]
            - paragraph
        - article [ref=e1245] [cursor=pointer]:
          - generic [ref=e1246]:
            - img [ref=e1248]
            - img "Bästa! missa inte sista..." [ref=e1250]
          - generic [ref=e1251]:
            - generic [ref=e1252]: JUL 05, 2026
            - heading "Bästa! missa inte sista..." [level=4] [ref=e1253]
            - paragraph [ref=e1254]: säsongen!
        - article [ref=e1255] [cursor=pointer]:
          - generic [ref=e1256]:
            - img [ref=e1258]
            - img "Ingen pratar om detta..." [ref=e1260]
          - generic [ref=e1261]:
            - generic [ref=e1262]: JUL 05, 2026
            - heading "Ingen pratar om detta..." [level=4] [ref=e1263]
            - paragraph [ref=e1264]: mästerverk längre, och soundtracket älskar jag med hela mitt hjärta! Vem...
        - article [ref=e1265] [cursor=pointer]:
          - generic [ref=e1266]:
            - img [ref=e1268]
            - img "Håller absolut med! Den..." [ref=e1270]
          - generic [ref=e1271]:
            - generic [ref=e1272]: JUL 04, 2026
            - heading "Håller absolut med! Den..." [level=4] [ref=e1273]
            - paragraph [ref=e1274]: första Fright Night var en upplevelse när det begav sig 1985....
        - article [ref=e1275] [cursor=pointer]:
          - generic [ref=e1276]:
            - img [ref=e1278]
            - img "Archive Photo" [ref=e1280]
          - generic [ref=e1281]:
            - generic [ref=e1282]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e1283]
            - paragraph
        - article [ref=e1284] [cursor=pointer]:
          - generic [ref=e1285]:
            - img [ref=e1287]
            - img "Brukar du se film..." [ref=e1289]
          - generic [ref=e1290]:
            - generic [ref=e1291]: JUL 04, 2026
            - heading "Brukar du se film..." [level=4] [ref=e1292]
            - paragraph [ref=e1293]: på dvd? Intresset för dvd-filmer och Blu-ray växer, och det senaste...
        - article [ref=e1294] [cursor=pointer]:
          - generic [ref=e1295]:
            - img [ref=e1297]
            - img "Archive Photo" [ref=e1299]
          - generic [ref=e1300]:
            - generic [ref=e1301]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e1302]
            - paragraph
        - article [ref=e1303] [cursor=pointer]:
          - generic [ref=e1304]:
            - img [ref=e1306]
            - img "The scene is from..." [ref=e1308]
          - generic [ref=e1309]:
            - generic [ref=e1310]: JUL 04, 2026
            - heading "The scene is from..." [level=4] [ref=e1311]
            - paragraph [ref=e1312]: Halt and Catch Fire, AMC’s drama about the 1980s-90s personal computer...
        - article [ref=e1313] [cursor=pointer]:
          - generic [ref=e1314]:
            - img [ref=e1316]
            - img "29 years later, Event..." [ref=e1318]
          - generic [ref=e1319]:
            - generic [ref=e1320]: JUL 04, 2026
            - heading "29 years later, Event..." [level=4] [ref=e1321]
            - paragraph [ref=e1322]: Horizon is finally getting a sequel — and it has the...
        - article [ref=e1323] [cursor=pointer]:
          - generic [ref=e1324]:
            - img [ref=e1326]
            - img "#TheTerror Season 3 is..." [ref=e1328]
          - generic [ref=e1329]:
            - generic [ref=e1330]: JUL 04, 2026
            - heading "#TheTerror Season 3 is..." [level=4] [ref=e1331]
            - paragraph [ref=e1332]: finally coming to AMC+, and we have an exclusive look at...
        - article [ref=e1333] [cursor=pointer]:
          - generic [ref=e1334]:
            - img [ref=e1336]
            - img "Stockholm får en helt..." [ref=e1338]
          - generic [ref=e1339]:
            - generic [ref=e1340]: JUL 04, 2026
            - heading "Stockholm får en helt..." [level=4] [ref=e1341]
            - paragraph [ref=e1342]: ny videobutik – Stock Home Video. Länk i kommentarerna.
        - article [ref=e1343] [cursor=pointer]:
          - generic [ref=e1344]:
            - img [ref=e1346]
            - img "Säga vad man vill..." [ref=e1348]
          - generic [ref=e1349]:
            - generic [ref=e1350]: JUL 04, 2026
            - heading "Säga vad man vill..." [level=4] [ref=e1351]
            - paragraph [ref=e1352]: om Pirates of Caribbean - lots of fun!
        - article [ref=e1353] [cursor=pointer]:
          - generic [ref=e1354]:
            - img [ref=e1356]
            - img "Archive Photo" [ref=e1358]
          - generic [ref=e1359]:
            - generic [ref=e1360]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e1361]
            - paragraph
        - article [ref=e1362] [cursor=pointer]:
          - generic [ref=e1363]:
            - img [ref=e1365]
            - img "Archive Photo" [ref=e1367]
          - generic [ref=e1368]:
            - generic [ref=e1369]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e1370]
            - paragraph
        - article [ref=e1371] [cursor=pointer]:
          - generic [ref=e1372]:
            - img [ref=e1374]
            - img "Archive Photo" [ref=e1376]
          - generic [ref=e1377]:
            - generic [ref=e1378]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e1379]
            - paragraph
        - article [ref=e1380] [cursor=pointer]:
          - generic [ref=e1381]:
            - img [ref=e1383]
            - img "Archive Photo" [ref=e1385]
          - generic [ref=e1386]:
            - generic [ref=e1387]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e1388]
            - paragraph
        - article [ref=e1389] [cursor=pointer]:
          - generic [ref=e1390]:
            - img [ref=e1392]
            - img "Archive Photo" [ref=e1394]
          - generic [ref=e1395]:
            - generic [ref=e1396]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e1397]
            - paragraph
        - article [ref=e1398] [cursor=pointer]:
          - generic [ref=e1399]:
            - img [ref=e1401]
            - img "Michael Mann’s genre-defining thriller..." [ref=e1403]
          - generic [ref=e1404]:
            - generic [ref=e1405]: JUL 04, 2026
            - heading "Michael Mann’s genre-defining thriller..." [level=4] [ref=e1406]
            - paragraph [ref=e1407]: "celebrates its 40th anniversary! Newly titled MANHUNTER: THE FINAL CUT, the..."
        - article [ref=e1408] [cursor=pointer]:
          - generic [ref=e1409]:
            - img [ref=e1411]
            - img "Archive Photo" [ref=e1413]
          - generic [ref=e1414]:
            - generic [ref=e1415]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e1416]
            - paragraph
        - article [ref=e1417] [cursor=pointer]:
          - generic [ref=e1418]:
            - img [ref=e1420]
            - img "The latest adaptation of..." [ref=e1422]
          - generic [ref=e1423]:
            - generic [ref=e1424]: JUL 04, 2026
            - heading "The latest adaptation of..." [level=4] [ref=e1425]
            - paragraph [ref=e1426]: one of the literary supervillain’s bestsellers is packed to the rafters...
        - article [ref=e1427] [cursor=pointer]:
          - generic [ref=e1428]:
            - img [ref=e1430]
            - img "😎😎😎" [ref=e1432]
          - generic [ref=e1433]:
            - generic [ref=e1434]: JUL 02, 2026
            - heading "😎😎😎" [level=4] [ref=e1435]
            - paragraph
        - article [ref=e1436] [cursor=pointer]:
          - generic [ref=e1437]:
            - img [ref=e1439]
            - img "Äntligen kan vi själva..." [ref=e1441]
          - generic [ref=e1442]:
            - generic [ref=e1443]: JUL 01, 2026
            - heading "Äntligen kan vi själva..." [level=4] [ref=e1444]
            - paragraph [ref=e1445]: besöka The Closet när vi vill! Criterions lilla Cineast skrubb med...
        - article [ref=e1446] [cursor=pointer]:
          - generic [ref=e1447]:
            - img [ref=e1449]
            - img "Underbara Geena Davies!" [ref=e1451]
          - generic [ref=e1452]:
            - generic [ref=e1453]: MAY 30, 2026
            - heading "Underbara Geena Davies!" [level=4] [ref=e1454]
            - paragraph
        - article [ref=e1455] [cursor=pointer]:
          - generic [ref=e1456]:
            - img [ref=e1458]
            - img "Älskar Michael Mann's Thief,..." [ref=e1460]
          - generic [ref=e1461]:
            - generic [ref=e1462]: MAY 30, 2026
            - heading "Älskar Michael Mann's Thief,..." [level=4] [ref=e1463]
            - paragraph [ref=e1464]: ända sedan jag såg den på 80-talet. Fantastiskt foto, musiken av...
        - article [ref=e1465] [cursor=pointer]:
          - generic [ref=e1466]:
            - img [ref=e1468]
            - img "Trots att jag länge..." [ref=e1470]
          - generic [ref=e1471]:
            - generic [ref=e1472]: MAY 30, 2026
            - heading "Trots att jag länge..." [level=4] [ref=e1473]
            - paragraph [ref=e1474]: velat se "For all Mankind" på Apple TV så har det...
        - article [ref=e1475] [cursor=pointer]:
          - generic [ref=e1476]:
            - img [ref=e1478]
            - img "Tror jag postat denna..." [ref=e1480]
          - generic [ref=e1481]:
            - generic [ref=e1482]: MAY 09, 2026
            - heading "Tror jag postat denna..." [level=4] [ref=e1483]
            - paragraph [ref=e1484]: tidigare. Lysande om det mest broskiga som gjorts någonsin i TV-SERIE...
        - article [ref=e1485] [cursor=pointer]:
          - generic [ref=e1486]:
            - img [ref=e1488]
            - img "Tim Cappello - \"Sexophone..." [ref=e1490]
          - generic [ref=e1491]:
            - generic [ref=e1492]: APR 25, 2026
            - heading "Tim Cappello - \"Sexophone..." [level=4] [ref=e1493]
            - paragraph [ref=e1494]: player" ikonisk och helt outstanding. 80-tals klassiker. Dyker plötsligt upp i...
        - article [ref=e1495] [cursor=pointer]:
          - generic [ref=e1496]:
            - img [ref=e1498]
            - img "Underbara Midnight Run. En..." [ref=e1500]
          - generic [ref=e1501]:
            - generic [ref=e1502]: APR 18, 2026
            - heading "Underbara Midnight Run. En..." [level=4] [ref=e1503]
            - paragraph [ref=e1504]: av de bästa Road Movies som gjorts! Och vilken kemi mellan...
        - article [ref=e1505] [cursor=pointer]:
          - generic [ref=e1506]:
            - img [ref=e1508]
            - img "Archive Photo" [ref=e1510]
          - generic [ref=e1511]:
            - generic [ref=e1512]: JUN 26, 2022
            - heading "Archive Photo" [level=4] [ref=e1513]
            - paragraph
        - article [ref=e1514] [cursor=pointer]:
          - generic [ref=e1515]:
            - img [ref=e1517]
            - img "Bugonia, 2025 - ★★★★½..." [ref=e1521]
          - generic [ref=e1522]:
            - generic [ref=e1523]: NOV 16, 2025
            - heading "Bugonia, 2025 - ★★★★½..." [level=4] [ref=e1524]
            - paragraph [ref=e1525]: Just saying. I’m totally blown away.Bugonia delivers yet another powerhouse performance...
        - article [ref=e1526] [cursor=pointer]:
          - generic [ref=e1527]:
            - img [ref=e1529]
            - 'img "Mission: Impossible – The..." [ref=e1533]'
          - generic [ref=e1534]:
            - generic [ref=e1535]: OCT 31, 2025
            - 'heading "Mission: Impossible – The..." [level=4] [ref=e1536]'
            - paragraph [ref=e1537]: Final Reckoning, 2025 - ★★★½ Watched on Wednesday October 29, 2025.
        - article [ref=e1538] [cursor=pointer]:
          - generic [ref=e1539]:
            - img [ref=e1541]
            - img "One Battle After Another,..." [ref=e1545]
          - generic [ref=e1546]:
            - generic [ref=e1547]: OCT 31, 2025
            - heading "One Battle After Another,..." [level=4] [ref=e1548]
            - paragraph [ref=e1549]: 2025 - ★★★★★ It will not ever be better than this....
        - article [ref=e1550] [cursor=pointer]:
          - generic [ref=e1551]:
            - img [ref=e1553]
            - img "After the Hunt, 2025..." [ref=e1557]
          - generic [ref=e1558]:
            - generic [ref=e1559]: OCT 19, 2025
            - heading "After the Hunt, 2025..." [level=4] [ref=e1560]
            - paragraph [ref=e1561]: "- ★★ Unfortunately this is not a good experience at all,..."
        - article [ref=e1562] [cursor=pointer]:
          - generic [ref=e1563]:
            - img [ref=e1565]
            - img "The Hitcher, 1986 -..." [ref=e1569]
          - generic [ref=e1570]:
            - generic [ref=e1571]: SEP 28, 2025
            - heading "The Hitcher, 1986 -..." [level=4] [ref=e1572]
            - paragraph [ref=e1573]: ★★★★★ One of the true masterpieces of eighties action-thrillers. Written by...
        - article [ref=e1574] [cursor=pointer]:
          - generic [ref=e1575]:
            - img [ref=e1577]
            - img "Gladiator II, 2024 -..." [ref=e1581]
          - generic [ref=e1582]:
            - generic [ref=e1583]: SEP 27, 2025
            - heading "Gladiator II, 2024 -..." [level=4] [ref=e1584]
            - paragraph [ref=e1585]: ★★½ Ridley recreates his old masterpiece with a simple formula, copyright...
        - article [ref=e1586] [cursor=pointer]:
          - generic [ref=e1587]:
            - img [ref=e1589]
            - img "The Brutalist, 2024 -..." [ref=e1593]
          - generic [ref=e1594]:
            - generic [ref=e1595]: SEP 27, 2025
            - heading "The Brutalist, 2024 -..." [level=4] [ref=e1596]
            - paragraph [ref=e1597]: ★★★ Fascinating, beautiful and gripping drama. Great performances by Felicity Jones,...
        - article [ref=e1598] [cursor=pointer]:
          - generic [ref=e1599]:
            - img [ref=e1601]
            - img "Aliens, 1986 - ★★★★★..." [ref=e1605]
          - generic [ref=e1606]:
            - generic [ref=e1607]: SEP 27, 2025
            - heading "Aliens, 1986 - ★★★★★..." [level=4] [ref=e1608]
            - paragraph [ref=e1609]: Special Edition of Aliens by J. Cameron. At last a chance...
        - article [ref=e1610] [cursor=pointer]:
          - generic [ref=e1611]:
            - img [ref=e1613]
            - img "Sinners, 2025 - ★★★..." [ref=e1617]
          - generic [ref=e1618]:
            - generic [ref=e1619]: SEP 27, 2025
            - heading "Sinners, 2025 - ★★★..." [level=4] [ref=e1620]
            - paragraph [ref=e1621]: Interesting take on the old classic Vampire Horror Theme. Really two...
        - article [ref=e1622] [cursor=pointer]:
          - generic [ref=e1623]:
            - img [ref=e1625]
            - img "28 Years Later, 2025..." [ref=e1629]
          - generic [ref=e1630]:
            - generic [ref=e1631]: SEP 27, 2025
            - heading "28 Years Later, 2025..." [level=4] [ref=e1632]
            - paragraph [ref=e1633]: "- ★★★★ Finally the old masters Boyle & Garland, are back..."
        - article [ref=e1634] [cursor=pointer]:
          - generic [ref=e1635]:
            - img [ref=e1637]
            - img "Superman, 2025 - ★★★½..." [ref=e1641]
          - generic [ref=e1642]:
            - generic [ref=e1643]: SEP 27, 2025
            - heading "Superman, 2025 - ★★★½..." [level=4] [ref=e1644]
            - paragraph [ref=e1645]: Great comeback! Back to the old, proven strong values and a...
        - article [ref=e1646] [cursor=pointer]:
          - generic [ref=e1647]:
            - img [ref=e1649]
            - img "Weapons, 2025 - ★★★★..." [ref=e1653]
          - generic [ref=e1654]:
            - generic [ref=e1655]: SEP 27, 2025
            - heading "Weapons, 2025 - ★★★★..." [level=4] [ref=e1656]
            - paragraph [ref=e1657]: Scary as hell, and funny actually. Love this small town drama...
        - article [ref=e1658] [cursor=pointer]:
          - generic [ref=e1659]:
            - img [ref=e1661]
            - img "The Long Walk, 2025..." [ref=e1665]
          - generic [ref=e1666]:
            - generic [ref=e1667]: SEP 27, 2025
            - heading "The Long Walk, 2025..." [level=4] [ref=e1668]
            - paragraph [ref=e1669]: "- ★★★½ Interesting Stephen King adaption. Great and Gripping, very violent...."
        - article [ref=e1670] [cursor=pointer]:
          - generic [ref=e1671]:
            - img [ref=e1673]
            - 'img "The Conjuring: Last Rites,..." [ref=e1677]'
          - generic [ref=e1678]:
            - generic [ref=e1679]: SEP 27, 2025
            - 'heading "The Conjuring: Last Rites,..." [level=4] [ref=e1680]'
            - paragraph [ref=e1681]: 2025 - ★★★½ Watched on Friday September 19, 2025.
        - article [ref=e1682] [cursor=pointer]:
          - generic [ref=e1683]:
            - img [ref=e1685]
            - img "It Follows, 2014 -..." [ref=e1689]
          - generic [ref=e1690]:
            - generic [ref=e1691]: DEC 13, 2019
            - heading "It Follows, 2014 -..." [level=4] [ref=e1692]
            - paragraph [ref=e1693]: ★★★ Watched on Saturday December 12, 2015.
        - article [ref=e1694] [cursor=pointer]:
          - generic [ref=e1695]:
            - img [ref=e1697]
            - img "Masterpieces" [ref=e1701]
          - generic [ref=e1702]:
            - generic [ref=e1703]: MAR 19, 2019
            - heading "Masterpieces" [level=4] [ref=e1704]
            - paragraph
        - article [ref=e1705] [cursor=pointer]:
          - generic [ref=e1706]:
            - img [ref=e1708]
            - img "The Waterdance, 1992 -..." [ref=e1712]
          - generic [ref=e1713]:
            - generic [ref=e1714]: MAR 05, 2019
            - heading "The Waterdance, 1992 -..." [level=4] [ref=e1715]
            - paragraph [ref=e1716]: ★★★★ A pure joy and a gem of a movie, fond...
        - article [ref=e1717] [cursor=pointer]:
          - generic [ref=e1718]:
            - img [ref=e1720]
            - img "Deliverance, 1972 - ★★★★★..." [ref=e1724]
          - generic [ref=e1725]:
            - generic [ref=e1726]: FEB 08, 2019
            - heading "Deliverance, 1972 - ★★★★★..." [level=4] [ref=e1727]
            - paragraph [ref=e1728]: A true classic and one film so true to the seventies...
        - article [ref=e1729] [cursor=pointer]:
          - generic [ref=e1730]:
            - img [ref=e1732]
            - img "Forty years today... in..." [ref=e1734]
          - generic [ref=e1735]:
            - generic [ref=e1736]: JUL 05, 2026
            - heading "Forty years today... in..." [level=4] [ref=e1737]
            - paragraph [ref=e1738]: the blink of an eye
        - article [ref=e1739] [cursor=pointer]:
          - generic [ref=e1740]:
            - img [ref=e1742]
            - img "Dream On" [ref=e1744]
          - generic [ref=e1745]:
            - generic [ref=e1746]: JUL 05, 2026
            - heading "Dream On" [level=4] [ref=e1747]
            - paragraph
        - article [ref=e1748] [cursor=pointer]:
          - generic [ref=e1749]:
            - img [ref=e1751]
            - img "Archive Photo" [ref=e1753]
          - generic [ref=e1754]:
            - generic [ref=e1755]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1756]
            - paragraph
        - article [ref=e1757] [cursor=pointer]:
          - generic [ref=e1758]:
            - img [ref=e1760]
            - img "Jon Hamm Reacts to..." [ref=e1762]
          - generic [ref=e1763]:
            - generic [ref=e1764]: JUL 05, 2026
            - heading "Jon Hamm Reacts to..." [level=4] [ref=e1765]
            - paragraph [ref=e1766]: His Viral Meme Moment Jon Hamm has shared his reaction after...
        - article [ref=e1767] [cursor=pointer]:
          - generic [ref=e1768]:
            - img [ref=e1770]
            - img "With a world-class cast..." [ref=e1772]
          - generic [ref=e1773]:
            - generic [ref=e1774]: JUL 05, 2026
            - heading "With a world-class cast..." [level=4] [ref=e1775]
            - paragraph [ref=e1776]: that will have you constantly saying ‘hey, it’s that guy!’, this...
        - article [ref=e1777] [cursor=pointer]:
          - generic [ref=e1778]:
            - img [ref=e1780]
            - img "The cast of Mike..." [ref=e1782]
          - generic [ref=e1783]:
            - generic [ref=e1784]: JUL 05, 2026
            - heading "The cast of Mike..." [level=4] [ref=e1785]
            - paragraph [ref=e1786]: "Flanagan’s ‘THE EXORCIST’: • Scarlett Johansson • Jacobi Jupe • Kate..."
        - article [ref=e1787] [cursor=pointer]:
          - generic [ref=e1788]:
            - img [ref=e1790]
            - img "bästa krigsfilmen, om du..." [ref=e1792]
          - generic [ref=e1793]:
            - generic [ref=e1794]: JUL 05, 2026
            - heading "bästa krigsfilmen, om du..." [level=4] [ref=e1795]
            - paragraph [ref=e1796]: gillar "full retard"
        - article [ref=e1797] [cursor=pointer]:
          - generic [ref=e1798]:
            - img [ref=e1800]
            - img "Archive Photo" [ref=e1802]
          - generic [ref=e1803]:
            - generic [ref=e1804]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1805]
            - paragraph
        - article [ref=e1806] [cursor=pointer]:
          - generic [ref=e1807]:
            - img [ref=e1809]
            - img "Sergio!" [ref=e1811]
          - generic [ref=e1812]:
            - generic [ref=e1813]: JUL 05, 2026
            - heading "Sergio!" [level=4] [ref=e1814]
            - paragraph
        - article [ref=e1815] [cursor=pointer]:
          - generic [ref=e1816]:
            - img [ref=e1818]
            - img "Dats true. Full retarded" [ref=e1820]
          - generic [ref=e1821]:
            - generic [ref=e1822]: JUL 05, 2026
            - heading "Dats true. Full retarded" [level=4] [ref=e1823]
            - paragraph
        - article [ref=e1824] [cursor=pointer]:
          - generic [ref=e1825]:
            - img [ref=e1827]
            - img "Så välförtjänt! Det läskigaste..." [ref=e1829]
          - generic [ref=e1830]:
            - generic [ref=e1831]: JUL 05, 2026
            - heading "Så välförtjänt! Det läskigaste..." [level=4] [ref=e1832]
            - paragraph [ref=e1833]: jag sett på bio på riktigt länge, se Weapons! Nu!
        - article [ref=e1834] [cursor=pointer]:
          - generic [ref=e1835]:
            - img [ref=e1837]
            - img "Archive Photo" [ref=e1839]
          - generic [ref=e1840]:
            - generic [ref=e1841]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1842]
            - paragraph
        - article [ref=e1843] [cursor=pointer]:
          - generic [ref=e1844]:
            - img [ref=e1846]
            - img "Wow Ethan Hawke briljerar..." [ref=e1848]
          - generic [ref=e1849]:
            - generic [ref=e1850]: JUL 05, 2026
            - heading "Wow Ethan Hawke briljerar..." [level=4] [ref=e1851]
            - paragraph [ref=e1852]: igen! Visdomsord! Ha en skön helg vänner
        - article [ref=e1853] [cursor=pointer]:
          - generic [ref=e1854]:
            - img [ref=e1856]
            - img "David Cronenberg hated Ridley..." [ref=e1858]
          - generic [ref=e1859]:
            - generic [ref=e1860]: JUL 05, 2026
            - heading "David Cronenberg hated Ridley..." [level=4] [ref=e1861]
            - paragraph [ref=e1862]: "Scott's 'Alien': \"A $300,000 B-movie with a $10million budget.”"
        - article [ref=e1863] [cursor=pointer]:
          - generic [ref=e1864]:
            - img [ref=e1866]
            - img "On this day in..." [ref=e1868]
          - generic [ref=e1869]:
            - generic [ref=e1870]: JUL 05, 2026
            - heading "On this day in..." [level=4] [ref=e1871]
            - paragraph [ref=e1872]: 1984, five students at Shermer High School reported at 7:00 a.m....
        - article [ref=e1873] [cursor=pointer]:
          - generic [ref=e1874]:
            - img [ref=e1876]
            - img "Ryan Gosling and Macaulay..." [ref=e1878]
          - generic [ref=e1879]:
            - generic [ref=e1880]: JUL 05, 2026
            - heading "Ryan Gosling and Macaulay..." [level=4] [ref=e1881]
            - paragraph [ref=e1882]: Culkin T-shirt Inception
        - article [ref=e1883] [cursor=pointer]:
          - generic [ref=e1884]:
            - img [ref=e1886]
            - img "klassiskt 80-tal med ett..." [ref=e1888]
          - generic [ref=e1889]:
            - generic [ref=e1890]: JUL 05, 2026
            - heading "klassiskt 80-tal med ett..." [level=4] [ref=e1891]
            - paragraph [ref=e1892]: av mina gamla favoritband som var väldigt tydliga med ett stort...
        - article [ref=e1893] [cursor=pointer]:
          - generic [ref=e1894]:
            - img [ref=e1896]
            - img "Archive Photo" [ref=e1898]
          - generic [ref=e1899]:
            - generic [ref=e1900]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1901]
            - paragraph
        - article [ref=e1902] [cursor=pointer]:
          - generic [ref=e1903]:
            - img [ref=e1905]
            - img "Detta känns som ett..." [ref=e1907]
          - generic [ref=e1908]:
            - generic [ref=e1909]: JUL 05, 2026
            - heading "Detta känns som ett..." [level=4] [ref=e1910]
            - paragraph [ref=e1911]: riktigt träningspass
        - article [ref=e1912] [cursor=pointer]:
          - generic [ref=e1913]:
            - img [ref=e1915]
            - img "Archive Photo" [ref=e1917]
          - generic [ref=e1918]:
            - generic [ref=e1919]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1920]
            - paragraph
        - article [ref=e1921] [cursor=pointer]:
          - generic [ref=e1922]:
            - img [ref=e1924]
            - img "Archive Photo" [ref=e1926]
          - generic [ref=e1927]:
            - generic [ref=e1928]: JUL 05, 2026
            - heading "Archive Photo" [level=4] [ref=e1929]
            - paragraph
        - article [ref=e1930] [cursor=pointer]:
          - generic [ref=e1931]:
            - img [ref=e1933]
            - img "Bästa! missa inte sista..." [ref=e1935]
          - generic [ref=e1936]:
            - generic [ref=e1937]: JUL 05, 2026
            - heading "Bästa! missa inte sista..." [level=4] [ref=e1938]
            - paragraph [ref=e1939]: säsongen!
        - article [ref=e1940] [cursor=pointer]:
          - generic [ref=e1941]:
            - img [ref=e1943]
            - img "Ingen pratar om detta..." [ref=e1945]
          - generic [ref=e1946]:
            - generic [ref=e1947]: JUL 05, 2026
            - heading "Ingen pratar om detta..." [level=4] [ref=e1948]
            - paragraph [ref=e1949]: mästerverk längre, och soundtracket älskar jag med hela mitt hjärta! Vem...
        - article [ref=e1950] [cursor=pointer]:
          - generic [ref=e1951]:
            - img [ref=e1953]
            - img "Håller absolut med! Den..." [ref=e1955]
          - generic [ref=e1956]:
            - generic [ref=e1957]: JUL 04, 2026
            - heading "Håller absolut med! Den..." [level=4] [ref=e1958]
            - paragraph [ref=e1959]: första Fright Night var en upplevelse när det begav sig 1985....
        - article [ref=e1960] [cursor=pointer]:
          - generic [ref=e1961]:
            - img [ref=e1963]
            - img "Archive Photo" [ref=e1965]
          - generic [ref=e1966]:
            - generic [ref=e1967]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e1968]
            - paragraph
        - article [ref=e1969] [cursor=pointer]:
          - generic [ref=e1970]:
            - img [ref=e1972]
            - img "Brukar du se film..." [ref=e1974]
          - generic [ref=e1975]:
            - generic [ref=e1976]: JUL 04, 2026
            - heading "Brukar du se film..." [level=4] [ref=e1977]
            - paragraph [ref=e1978]: på dvd? Intresset för dvd-filmer och Blu-ray växer, och det senaste...
        - article [ref=e1979] [cursor=pointer]:
          - generic [ref=e1980]:
            - img [ref=e1982]
            - img "Archive Photo" [ref=e1984]
          - generic [ref=e1985]:
            - generic [ref=e1986]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e1987]
            - paragraph
        - article [ref=e1988] [cursor=pointer]:
          - generic [ref=e1989]:
            - img [ref=e1991]
            - img "The scene is from..." [ref=e1993]
          - generic [ref=e1994]:
            - generic [ref=e1995]: JUL 04, 2026
            - heading "The scene is from..." [level=4] [ref=e1996]
            - paragraph [ref=e1997]: Halt and Catch Fire, AMC’s drama about the 1980s-90s personal computer...
        - article [ref=e1998] [cursor=pointer]:
          - generic [ref=e1999]:
            - img [ref=e2001]
            - img "29 years later, Event..." [ref=e2003]
          - generic [ref=e2004]:
            - generic [ref=e2005]: JUL 04, 2026
            - heading "29 years later, Event..." [level=4] [ref=e2006]
            - paragraph [ref=e2007]: Horizon is finally getting a sequel — and it has the...
        - article [ref=e2008] [cursor=pointer]:
          - generic [ref=e2009]:
            - img [ref=e2011]
            - img "#TheTerror Season 3 is..." [ref=e2013]
          - generic [ref=e2014]:
            - generic [ref=e2015]: JUL 04, 2026
            - heading "#TheTerror Season 3 is..." [level=4] [ref=e2016]
            - paragraph [ref=e2017]: finally coming to AMC+, and we have an exclusive look at...
        - article [ref=e2018] [cursor=pointer]:
          - generic [ref=e2019]:
            - img [ref=e2021]
            - img "Stockholm får en helt..." [ref=e2023]
          - generic [ref=e2024]:
            - generic [ref=e2025]: JUL 04, 2026
            - heading "Stockholm får en helt..." [level=4] [ref=e2026]
            - paragraph [ref=e2027]: ny videobutik – Stock Home Video. Länk i kommentarerna.
        - article [ref=e2028] [cursor=pointer]:
          - generic [ref=e2029]:
            - img [ref=e2031]
            - img "Säga vad man vill..." [ref=e2033]
          - generic [ref=e2034]:
            - generic [ref=e2035]: JUL 04, 2026
            - heading "Säga vad man vill..." [level=4] [ref=e2036]
            - paragraph [ref=e2037]: om Pirates of Caribbean - lots of fun!
        - article [ref=e2038] [cursor=pointer]:
          - generic [ref=e2039]:
            - img [ref=e2041]
            - img "Archive Photo" [ref=e2043]
          - generic [ref=e2044]:
            - generic [ref=e2045]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e2046]
            - paragraph
        - article [ref=e2047] [cursor=pointer]:
          - generic [ref=e2048]:
            - img [ref=e2050]
            - img "Archive Photo" [ref=e2052]
          - generic [ref=e2053]:
            - generic [ref=e2054]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e2055]
            - paragraph
        - article [ref=e2056] [cursor=pointer]:
          - generic [ref=e2057]:
            - img [ref=e2059]
            - img "Archive Photo" [ref=e2061]
          - generic [ref=e2062]:
            - generic [ref=e2063]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e2064]
            - paragraph
        - article [ref=e2065] [cursor=pointer]:
          - generic [ref=e2066]:
            - img [ref=e2068]
            - img "Archive Photo" [ref=e2070]
          - generic [ref=e2071]:
            - generic [ref=e2072]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e2073]
            - paragraph
        - article [ref=e2074] [cursor=pointer]:
          - generic [ref=e2075]:
            - img [ref=e2077]
            - img "Archive Photo" [ref=e2079]
          - generic [ref=e2080]:
            - generic [ref=e2081]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e2082]
            - paragraph
        - article [ref=e2083] [cursor=pointer]:
          - generic [ref=e2084]:
            - img [ref=e2086]
            - img "Michael Mann’s genre-defining thriller..." [ref=e2088]
          - generic [ref=e2089]:
            - generic [ref=e2090]: JUL 04, 2026
            - heading "Michael Mann’s genre-defining thriller..." [level=4] [ref=e2091]
            - paragraph [ref=e2092]: "celebrates its 40th anniversary! Newly titled MANHUNTER: THE FINAL CUT, the..."
        - article [ref=e2093] [cursor=pointer]:
          - generic [ref=e2094]:
            - img [ref=e2096]
            - img "Archive Photo" [ref=e2098]
          - generic [ref=e2099]:
            - generic [ref=e2100]: JUL 04, 2026
            - heading "Archive Photo" [level=4] [ref=e2101]
            - paragraph
        - article [ref=e2102] [cursor=pointer]:
          - generic [ref=e2103]:
            - img [ref=e2105]
            - img "The latest adaptation of..." [ref=e2107]
          - generic [ref=e2108]:
            - generic [ref=e2109]: JUL 04, 2026
            - heading "The latest adaptation of..." [level=4] [ref=e2110]
            - paragraph [ref=e2111]: one of the literary supervillain’s bestsellers is packed to the rafters...
        - article [ref=e2112] [cursor=pointer]:
          - generic [ref=e2113]:
            - img [ref=e2115]
            - img "😎😎😎" [ref=e2117]
          - generic [ref=e2118]:
            - generic [ref=e2119]: JUL 02, 2026
            - heading "😎😎😎" [level=4] [ref=e2120]
            - paragraph
        - article [ref=e2121] [cursor=pointer]:
          - generic [ref=e2122]:
            - img [ref=e2124]
            - img "Äntligen kan vi själva..." [ref=e2126]
          - generic [ref=e2127]:
            - generic [ref=e2128]: JUL 01, 2026
            - heading "Äntligen kan vi själva..." [level=4] [ref=e2129]
            - paragraph [ref=e2130]: besöka The Closet när vi vill! Criterions lilla Cineast skrubb med...
        - article [ref=e2131] [cursor=pointer]:
          - generic [ref=e2132]:
            - img [ref=e2134]
            - img "Underbara Geena Davies!" [ref=e2136]
          - generic [ref=e2137]:
            - generic [ref=e2138]: MAY 30, 2026
            - heading "Underbara Geena Davies!" [level=4] [ref=e2139]
            - paragraph
        - article [ref=e2140] [cursor=pointer]:
          - generic [ref=e2141]:
            - img [ref=e2143]
            - img "Älskar Michael Mann's Thief,..." [ref=e2145]
          - generic [ref=e2146]:
            - generic [ref=e2147]: MAY 30, 2026
            - heading "Älskar Michael Mann's Thief,..." [level=4] [ref=e2148]
            - paragraph [ref=e2149]: ända sedan jag såg den på 80-talet. Fantastiskt foto, musiken av...
        - article [ref=e2150] [cursor=pointer]:
          - generic [ref=e2151]:
            - img [ref=e2153]
            - img "Trots att jag länge..." [ref=e2155]
          - generic [ref=e2156]:
            - generic [ref=e2157]: MAY 30, 2026
            - heading "Trots att jag länge..." [level=4] [ref=e2158]
            - paragraph [ref=e2159]: velat se "For all Mankind" på Apple TV så har det...
        - article [ref=e2160] [cursor=pointer]:
          - generic [ref=e2161]:
            - img [ref=e2163]
            - img "Tror jag postat denna..." [ref=e2165]
          - generic [ref=e2166]:
            - generic [ref=e2167]: MAY 09, 2026
            - heading "Tror jag postat denna..." [level=4] [ref=e2168]
            - paragraph [ref=e2169]: tidigare. Lysande om det mest broskiga som gjorts någonsin i TV-SERIE...
        - article [ref=e2170] [cursor=pointer]:
          - generic [ref=e2171]:
            - img [ref=e2173]
            - img "Tim Cappello - \"Sexophone..." [ref=e2175]
          - generic [ref=e2176]:
            - generic [ref=e2177]: APR 25, 2026
            - heading "Tim Cappello - \"Sexophone..." [level=4] [ref=e2178]
            - paragraph [ref=e2179]: player" ikonisk och helt outstanding. 80-tals klassiker. Dyker plötsligt upp i...
        - article [ref=e2180] [cursor=pointer]:
          - generic [ref=e2181]:
            - img [ref=e2183]
            - img "Underbara Midnight Run. En..." [ref=e2185]
          - generic [ref=e2186]:
            - generic [ref=e2187]: APR 18, 2026
            - heading "Underbara Midnight Run. En..." [level=4] [ref=e2188]
            - paragraph [ref=e2189]: av de bästa Road Movies som gjorts! Och vilken kemi mellan...
        - article [ref=e2190] [cursor=pointer]:
          - generic [ref=e2191]:
            - img [ref=e2193]
            - img "Archive Photo" [ref=e2195]
          - generic [ref=e2196]:
            - generic [ref=e2197]: JUN 26, 2022
            - heading "Archive Photo" [level=4] [ref=e2198]
            - paragraph
  - contentinfo [ref=e2199]:
    - generic [ref=e2200]:
      - generic [ref=e2201]:
        - generic [ref=e2202]: BRAND
        - link "CINEAST" [ref=e2203] [cursor=pointer]:
          - /url: /
        - paragraph [ref=e2204]: End credits for the observant.
        - paragraph [ref=e2205]: Presented by Cineast.
      - generic [ref=e2206]:
        - generic [ref=e2207]: NAVIGATION
        - list [ref=e2208]:
          - listitem [ref=e2209]:
            - link "Shop →" [ref=e2210] [cursor=pointer]:
              - /url: "#shop"
          - listitem [ref=e2211]:
            - link "Journal →" [ref=e2212] [cursor=pointer]:
              - /url: "#journal"
          - listitem [ref=e2213]:
            - link "Archive →" [ref=e2214] [cursor=pointer]:
              - /url: "#shop"
          - listitem [ref=e2215]:
            - link "About →" [ref=e2216] [cursor=pointer]:
              - /url: "#about"
      - generic [ref=e2217]:
        - generic [ref=e2218]: CUSTOMER
        - list [ref=e2219]:
          - listitem [ref=e2220]:
            - link "Shipping →" [ref=e2221] [cursor=pointer]:
              - /url: "#customer-drawer"
          - listitem [ref=e2222]:
            - link "Returns →" [ref=e2223] [cursor=pointer]:
              - /url: "#customer-drawer"
          - listitem [ref=e2224]:
            - link "Contact →" [ref=e2225] [cursor=pointer]:
              - /url: mailto:cineast@rynell.org
          - listitem [ref=e2226]:
            - link "FAQ →" [ref=e2227] [cursor=pointer]:
              - /url: "#customer-drawer"
      - generic [ref=e2228]:
        - generic [ref=e2229]: CONNECT
        - list [ref=e2230]:
          - listitem [ref=e2231]:
            - link "Instagram →" [ref=e2232] [cursor=pointer]:
              - /url: https://instagram.com
          - listitem [ref=e2233]:
            - link "Pinterest →" [ref=e2234] [cursor=pointer]:
              - /url: https://pinterest.com
          - listitem [ref=e2235]:
            - link "Newsletter →" [ref=e2236] [cursor=pointer]:
              - /url: "#about"
    - generic [ref=e2237]:
      - generic [ref=e2238]: CINEAST
      - generic [ref=e2239]: /
      - generic [ref=e2240]: ALL RIGHTS RESERVED
      - generic [ref=e2241]: /
      - generic [ref=e2242]: ARCHIVE SYSTEM ACTIVE
      - generic [ref=e2243]: FADE OUT
  - complementary [ref=e2244]:
    - generic [ref=e2245]:
      - generic [ref=e2246]: JOURNAL ENTRY / DATE
      - button [ref=e2247] [cursor=pointer]:
        - img [ref=e2248]
    - generic [ref=e2252]:
      - button [ref=e2253] [cursor=pointer]:
        - img [ref=e2254]
        - generic [ref=e2256]: PREV
      - button [ref=e2257] [cursor=pointer]:
        - generic [ref=e2258]: NEXT
        - img [ref=e2259]
  - complementary [ref=e2261]:
    - generic [ref=e2262]:
      - generic [ref=e2263]: NOW SHOWING / ALL NOTES
      - button [ref=e2264] [cursor=pointer]:
        - img [ref=e2265]
  - complementary [ref=e2269]:
    - generic [ref=e2270]:
      - generic [ref=e2271]: ACCOUNT / CINEAST CMS
      - button [ref=e2272] [cursor=pointer]:
        - img [ref=e2273]
    - generic [ref=e2276]:
      - generic [ref=e2277]:
        - generic [ref=e2278]:
          - generic [ref=e2279]: Session
          - generic [ref=e2280]: SIGNED OUT
        - generic [ref=e2281]:
          - generic [ref=e2282]: Sign in or create a member account to read published pages and access the CMS tools.
          - generic [ref=e2283]:
            - generic [ref=e2284]:
              - generic [ref=e2285]: Current user
              - generic [ref=e2286]: Guest
            - generic [ref=e2287]:
              - generic [ref=e2288]: Access level
              - generic [ref=e2289]: member
            - generic [ref=e2290]:
              - generic [ref=e2291]: Database
              - generic [ref=e2294]: Checking
            - generic [ref=e2295]:
              - generic [ref=e2296]: TMDB Scraper
              - generic [ref=e2299]: Checking
            - generic [ref=e2300]:
              - generic [ref=e2301]: TVDB Scraper
              - generic [ref=e2304]: Checking
            - generic [ref=e2305]:
              - generic [ref=e2306]: iTunes Scraper
              - generic [ref=e2309]: Checking
            - generic [ref=e2310]:
              - generic [ref=e2311]: Open Library Scraper
              - generic [ref=e2314]: Checking
          - generic [ref=e2315]:
            - button [ref=e2316] [cursor=pointer]: SIGN IN
            - button [ref=e2317] [cursor=pointer]: CREATE ACCOUNT
          - generic [ref=e2318]: No active session yet.
      - generic [ref=e2319]:
        - generic [ref=e2320]:
          - generic [ref=e2321]: Access
          - generic [ref=e2322]: LOGIN / REGISTER
        - generic [ref=e2323]:
          - generic [ref=e2324]:
            - button [ref=e2325] [cursor=pointer]: Sign In
            - button [ref=e2326] [cursor=pointer]: Create Account
          - generic [ref=e2327]:
            - generic [ref=e2328]:
              - generic [ref=e2329]: Username
              - textbox [ref=e2330]
            - generic [ref=e2331]:
              - generic [ref=e2332]: Password
              - textbox [ref=e2333]
            - button [ref=e2335] [cursor=pointer]: SIGN IN
  - complementary [ref=e2336]:
    - generic [ref=e2337]:
      - generic [ref=e2338]: YOUR CART / CHECKOUT
      - button [ref=e2339] [cursor=pointer]:
        - img [ref=e2340]
    - generic [ref=e2344]:
      - generic [ref=e2345]:
        - generic [ref=e2346]: SUBTOTAL
        - generic [ref=e2347]: $0.00
      - button [ref=e2348] [cursor=pointer]: PROCEED TO CHECKOUT
  - complementary [ref=e2349]:
    - generic [ref=e2350]:
      - generic [ref=e2351]: CUSTOMER / CINEAST
      - button [ref=e2352] [cursor=pointer]:
        - img [ref=e2353]
  - generic:
    - button:
      - img
    - generic: DRAG AND HAVE A LOOK
  - generic: ADDED TO CART
  - generic:
    - generic:
      - button "Close Video": ×
      - iframe [ref=e2357]:
        
```

# Test source

```ts
  168 |     b: Number(parts[2]),
  169 |     a: parts[3] === undefined ? 1 : Number(parts[3])
  170 |   };
  171 | }
  172 | 
  173 | function luminance({ r, g, b }) {
  174 |   const channels = [r, g, b].map((value) => {
  175 |     const normalized = value / 255;
  176 |     return normalized <= 0.03928
  177 |       ? normalized / 12.92
  178 |       : ((normalized + 0.055) / 1.055) ** 2.4;
  179 |   });
  180 |   return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  181 | }
  182 | 
  183 | function contrastRatio(foreground, background) {
  184 |   const fg = luminance(foreground);
  185 |   const bg = luminance(background);
  186 |   const lighter = Math.max(fg, bg);
  187 |   const darker = Math.min(fg, bg);
  188 |   return (lighter + 0.05) / (darker + 0.05);
  189 | }
  190 | 
  191 | test.describe('Critical Theme Sections', () => {
  192 |   for (const theme of THEMES) {
  193 |     test(`Homepage critical sections stay visible - ${theme}`, async ({ page }) => {
  194 |       await page.goto('/', { waitUntil: 'domcontentloaded' });
  195 |       await setTheme(page, theme);
  196 |       await waitForHomepageContent(page);
  197 | 
  198 |       for (const item of HOMEPAGE_CRITICAL_SELECTORS) {
  199 |         await assertReadableElement(page, item.selector, `${theme} ${item.name}`);
  200 |       }
  201 |     });
  202 |   }
  203 | 
  204 |   test('Mono homepage critical text keeps strong contrast', async ({ page }) => {
  205 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  206 |     await setTheme(page, 'mono');
  207 |     await waitForHomepageContent(page);
  208 | 
  209 |     for (const selector of MONO_STRICT_SELECTORS) {
  210 |       await assertMonoContrast(page, selector);
  211 |     }
  212 |   });
  213 | 
  214 |   test('Now Showing notes drawer remains readable in every theme', async ({ page }) => {
  215 |     for (const theme of THEMES) {
  216 |       await page.goto('/', { waitUntil: 'domcontentloaded' });
  217 |       await setTheme(page, theme);
  218 |       await waitForHomepageContent(page);
  219 |       await page.locator('[data-now-showing-notes-open]').click();
  220 |       await expect(page.locator('#now-showing-notes-drawer')).toHaveClass(/open/);
  221 | 
  222 |       await assertReadableElement(page, '.now-notes-title', `${theme} notes drawer title`);
  223 |       await assertReadableElement(page, '.now-notes-filter', `${theme} notes drawer filter`);
  224 |       await assertReadableElement(page, '.now-notes-card h3', `${theme} notes drawer card title`);
  225 |       await page.locator('#now-showing-notes-close').click();
  226 |     }
  227 |   });
  228 | 
  229 |   test('Phone visitors always render mono and hide the top-nav theme control', async ({ page }) => {
  230 |     await page.setViewportSize({ width: 390, height: 844 });
  231 | 
  232 |     for (const path of ['/', '/article.html']) {
  233 |       await page.goto(path, { waitUntil: 'domcontentloaded' });
  234 |       await page.evaluate(() => localStorage.setItem('theme', 'blanco'));
  235 |       await page.reload({ waitUntil: 'domcontentloaded' });
  236 |       await expect(page.locator('html')).toHaveAttribute('data-theme', 'mono');
  237 |     }
  238 | 
  239 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  240 |     await expect(page.locator('#theme-dropdown')).toBeHidden();
  241 |   });
  242 | 
  243 |   test('Phone mono shop and archive controls stay inside the viewport', async ({ page }) => {
  244 |     await page.setViewportSize({ width: 390, height: 844 });
  245 |     await page.goto('/#shop', { waitUntil: 'domcontentloaded' });
  246 |     await page.evaluate(() => localStorage.setItem('theme', 'blanco'));
  247 |     await page.reload({ waitUntil: 'domcontentloaded' });
  248 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'mono');
  249 |     await expect(page.locator('.product-card').first()).toBeVisible();
  250 | 
  251 |     const shopLayout = await page.evaluate(() => {
  252 |       const viewportWidth = window.innerWidth;
  253 |       const productCards = Array.from(document.querySelectorAll('.product-grid .product-card')).slice(0, 3);
  254 |       return {
  255 |         scrollWidth: document.documentElement.scrollWidth,
  256 |         viewportWidth,
  257 |         productWidths: productCards.map((card) => card.getBoundingClientRect().width),
  258 |         productRights: productCards.map((card) => card.getBoundingClientRect().right)
  259 |       };
  260 |     });
  261 | 
  262 |     expect(shopLayout.scrollWidth, 'phone shop should not create page-level horizontal overflow').toBeLessThanOrEqual(shopLayout.viewportWidth + 2);
  263 |     for (const width of shopLayout.productWidths) {
  264 |       expect(width, 'phone mono product cards should be one readable column').toBeGreaterThan(shopLayout.viewportWidth * 0.82);
  265 |       expect(width, 'phone mono product cards should fit inside the viewport').toBeLessThanOrEqual(shopLayout.viewportWidth + 8);
  266 |     }
  267 |     for (const right of shopLayout.productRights) {
> 268 |       expect(right, 'phone mono product card should not extend past viewport').toBeLessThanOrEqual(shopLayout.viewportWidth + 1);
      |                                                                                ^ Error: phone mono product card should not extend past viewport
  269 |     }
  270 | 
  271 |     await page.goto('/#global-search-panel', { waitUntil: 'domcontentloaded' });
  272 |     await page.evaluate(() => {
  273 |       const panel = document.getElementById('global-search-panel');
  274 |       if (panel) panel.classList.add('open');
  275 |     });
  276 |     await expect(page.locator('#global-search-panel')).toHaveClass(/open/);
  277 |     await assertMonoContrast(page, '.global-search-panel .archive-filter-chip');
  278 |     await assertMonoContrast(page, '.global-search-panel .tag-btn');
  279 |     await assertMonoContrast(page, '.global-search-panel .global-search-empty');
  280 |   });
  281 | 
  282 |   test('Archive search matches spaced and unspaced actor names', async ({ page }) => {
  283 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  284 |     await page.locator('.search-btn').click();
  285 |     await expect(page.locator('#global-search-panel')).toHaveClass(/open/);
  286 | 
  287 |     await page.locator('#global-search-input').fill('Robert Deniro');
  288 |     await expect(page.locator('#global-results-count')).toContainText(/MATCHING SCENE/);
  289 |     await expect(page.locator('#global-search-results-grid .short-card').first()).toBeVisible();
  290 | 
  291 |     const resultText = await page.locator('#global-search-results-grid').innerText();
  292 |     expect(resultText.toLowerCase()).toMatch(/deniro|de niro|midnight run/);
  293 |   });
  294 | 
  295 |   test('Shorts feed follows blanco and mono theme surfaces', async ({ page }) => {
  296 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  297 | 
  298 |     for (const theme of ['blanco', 'mono']) {
  299 |       await setTheme(page, theme);
  300 |       await expect(page.locator('#shorts .short-card').first()).toBeVisible();
  301 | 
  302 |       const surface = await page.locator('#shorts').evaluate((element) => {
  303 |         const style = window.getComputedStyle(element);
  304 |         return {
  305 |           backgroundColor: style.backgroundColor,
  306 |           color: style.color
  307 |         };
  308 |       });
  309 |       const cardSurface = await page.locator('#shorts .short-card').first().evaluate((element) => {
  310 |         const style = window.getComputedStyle(element);
  311 |         return {
  312 |           backgroundColor: style.backgroundColor,
  313 |           borderColor: style.borderColor
  314 |         };
  315 |       });
  316 | 
  317 |       expect(luminance(parseColor(surface.backgroundColor)), `${theme} shorts section should not use noir black`).toBeGreaterThan(0.72);
  318 |       expect(luminance(parseColor(cardSurface.backgroundColor)), `${theme} shorts card should not use noir black`).toBeGreaterThan(0.72);
  319 |       await assertReadableElement(page, '#shorts .section-label', `${theme} shorts label`);
  320 |       await assertReadableElement(page, '#shorts .section-meta', `${theme} shorts meta`);
  321 |       await assertReadableElement(page, '#shorts .short-title', `${theme} shorts card title`);
  322 |       await assertReadableElement(page, '#shorts .short-excerpt', `${theme} shorts card excerpt`);
  323 |     }
  324 |   });
  325 | 
  326 |   test('Mono drawers use white surfaces and readable black text', async ({ page }) => {
  327 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  328 |     await setTheme(page, 'mono');
  329 |     await waitForHomepageContent(page);
  330 | 
  331 |     await page.locator('#open-account-drawer').click();
  332 |     await expect(page.locator('#account-drawer')).toHaveClass(/open/);
  333 |     await expectLightSurface(page, '#account-drawer');
  334 |     await assertMonoContrast(page, '#account-drawer .account-panel-title');
  335 |     await assertMonoContrast(page, '#account-drawer .account-note');
  336 |     await assertMonoContrast(page, '#account-drawer .account-status-row');
  337 |     await assertMonoContrast(page, '#account-drawer .account-db-status');
  338 |     await page.locator('#account-drawer-close').click();
  339 | 
  340 |     await page.locator('.cart-link').click();
  341 |     await expect(page.locator('#cart-drawer')).toHaveClass(/open/);
  342 |     await expectLightSurface(page, '#cart-drawer');
  343 |     await assertMonoContrast(page, '#cart-drawer .empty-cart-message');
  344 |     await page.locator('#cart-drawer-close').click();
  345 | 
  346 |     await page.locator('[data-customer-drawer="shipping"]').last().click();
  347 |     await expect(page.locator('#customer-drawer')).toHaveClass(/open/);
  348 |     await expectLightSurface(page, '#customer-drawer');
  349 |     await assertMonoContrast(page, '#customer-drawer .customer-drawer-title');
  350 |     await assertMonoContrast(page, '#customer-drawer .customer-drawer-body');
  351 |     await assertMonoContrast(page, '#customer-drawer .customer-drawer-note');
  352 |   });
  353 | 
  354 |   test('Mono background images are desktop-only and limited to hero search and road notes', async ({ page }) => {
  355 |     await page.setViewportSize({ width: 1440, height: 1000 });
  356 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  357 |     await setTheme(page, 'mono');
  358 |     await waitForHomepageContent(page);
  359 | 
  360 |     await expectBackgroundImage(page, '.hero-bg', 'mono_bg_hero.webp');
  361 |     await expectBackgroundImage(page, '.search-section-bg', 'mono_bg_search_eye.webp');
  362 |     await expectBackgroundImage(page, '.road-intro-bg', 'mono_bg_road.webp');
  363 |     await expectNoBackgroundImage(page, '.shop-hero-bg');
  364 | 
  365 |     await page.setViewportSize({ width: 390, height: 844 });
  366 |     await page.reload({ waitUntil: 'domcontentloaded' });
  367 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'mono');
  368 |     await expectNoBackgroundImage(page, '.hero-bg');
```