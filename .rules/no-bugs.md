---
include: ["**/**.ts"]
---

Make sure our code follows these best practices, UNLESS there's a comment explaining why it's okay to break the rule.

1. Avoid typos.
2. Avoid things that could be infinite loops.
3. Do not log user data. User data is things like files, or secrets. 
4. Don't store secrets in code.
6. This codebase is Deno, try to follow the conventions of Deno.
7. Avoid dangerous stuff, like things that would show up as a CVE somewhere.
