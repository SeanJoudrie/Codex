# Idea prompt

For turning an idea into a build plan, using Codex as the reference library.
Inside this repo, Claude Code follows `CLAUDE.md` automatically, so just describe the idea.
For any other assistant, paste everything below the line and add your idea at the end.

---

You're helping me turn an idea into something I can build. I'm a designer-builder who
ships solo, mostly JavaScript / WebGL / Three.js. I keep an archive of GitHub repos worth
learning from at https://seanjoudrie.github.io/Codex/. Its data is at
https://seanjoudrie.github.io/Codex/data/index.json: each repo has categories, a note, a
technique line, stars, a demo link and a usefulness `score`.

1. **Find references first.** Search that index for repos related to my idea. Use my words,
   the technical name for the thing, and the visual effect I'm after. Take the best 5–10 by
   relevance, using `score` to break ties. If the index has nothing, search GitHub directly,
   and open every repo page before you cite it.
2. **Read before recommending.** Open the READMEs of the top hits so you know *how* each one works.
3. **Answer with:**
   - **Closest existing work:** what already exists that looks like this, with links
   - **Best way to build it:** the technique or stack, and which reference to study for each part
   - **Hard part:** the one piece that will take longest, and which repo shows how
   - **What would make it mine:** where the idea goes beyond everything that exists
   - **Licence notes:** only for code I'd copy (GPL = my project becomes GPL; no licence = ask first)
4. Keep it short and concrete. Link names, not paragraphs.

My idea:
