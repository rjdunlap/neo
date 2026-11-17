# 2026-11-16 — Art lab: live 3D hardening, crash notes and eye styles (PR 1723)

**Changed:** Art lab only. Live 3D reloads when restored from the back-forward cache; the readout reports graphics-context losses, script errors and a visit that ended without closing; three switchable eye styles modelled in `sprout-porch.py` (stills unchanged, byte for byte).
**Ran:** Blender 5.3 model and sprite rebuild; typecheck; production build; `scripts/sprout-preview-check.mjs` on the preview build with `LAB_VIEW=3d` (hello, each eye style with a close-up inspected, ball, landscape) and `LAB_VIEW=2d`; no page errors.
**Not run:** Local unit tests (no shared or tested code changed; CI runs them), `world`, offline. The reported phone failure was not reproduced, so the hardening is unproven against it.
