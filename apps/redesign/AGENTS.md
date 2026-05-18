<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Never add something to globals.css unless it affects the entire site. If it is only for one page, make a separate .module.css file for that page.

Use as many server components as possible. If you need a client feature, create a seperate client component for that feature.

When you design a new section, always make sure it fits the rest of the website. Make it look like a unified design.