---
name: OpenAPI numeric compatibility
description: Compatibility constraint between the workspace OpenAPI generator and its installed Zod runtime.
---

The current generated Zod target is Zod 3, while the installed Orval version emits `z.int()` for OpenAPI integer fields. Represent numeric API fields as `number` in OpenAPI unless the generator/runtime pairing is upgraded together.

**Why:** Code generation succeeds, but the chained workspace typecheck fails when generated validators call an API that only exists in Zod 4.

**How to apply:** After changing the OpenAPI spec, run the repository codegen and library typecheck before wiring generated schemas into routes or clients.