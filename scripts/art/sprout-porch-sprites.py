"""Pre-rendered porch for the art lab's Pixi view. Blender 5.3:
    blender -b src/dev/sprout/porch.blend -t 4 --python scripts/art/sprout-porch-sprites.py
Reads the scene sprout-porch.py built and writes a backdrop, Sprout's moving parts and a manifest to
src/dev/sprout/sprites/. The camera matches src/dev/art-lab/artlab-3d.ts, so both views frame the porch alike.
No external assets or randomness; the .blend is not saved.
"""
import bpy, json, math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/dev/sprout/sprites'
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 1440    # square frame, pixels
UNITS = 8      # world units across the frame (180 px per unit)
PAD = 6

scene = bpy.context.scene
ob = scene.objects
# Browser camera (three.js, y up): position (4.4, 4.2, 7.5), looking at (0, 1.25, -0.4).
bpy.ops.object.camera_add(location=(4.4, -7.5, 4.2)); cam = bpy.context.object
cam.rotation_euler = (Vector((0, .4, 1.25)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.type = 'ORTHO'; cam.data.ortho_scale = UNITS; scene.camera = cam
r = scene.render
r.engine = 'CYCLES'; scene.cycles.samples = 64; scene.cycles.use_denoising = True; scene.cycles.seed = 0
r.resolution_x = r.resolution_y = SIZE; r.resolution_percentage = 100
r.film_transparent = True
r.image_settings.file_format = 'WEBP'; r.image_settings.color_mode = 'RGBA'; r.image_settings.quality = 86
bpy.context.view_layer.update()

def meshes(root):
    return [o for o in [root, *root.children_recursive] if o.type == 'MESH']

sprout, head, arm, ball = ob['Sprout'], ob['Head'], ob['RightArm'], ob['Ball']
eyes = [o for o in head.children if o.type == 'EMPTY' and o.name.startswith('Eye')]
assert len(eyes) == 2, 'two eye pivots'
SPROUT, HEAD, ARM, BALL = meshes(sprout), meshes(head), meshes(arm), meshes(ball)
BODY = [m for m in SPROUT if m not in HEAD and m not in ARM]
STATIC = [o for o in ob if o.type == 'MESH' and o not in SPROUT and o not in BALL]
EVERY = [o for o in ob if o.type == 'MESH']

def px(point):
    """World point to frame pixels, origin top left."""
    v = world_to_camera_view(scene, cam, Vector(point))
    return [round(v.x * SIZE, 2), round((1 - v.y) * SIZE, 2)]

def bounds(objs):
    xs, ys = [], []
    for o in objs:
        for c in o.bound_box:
            x, y = px(o.matrix_world @ Vector(c)); xs.append(x); ys.append(y)
    return (max(0, math.floor(min(xs)) - PAD), max(0, math.floor(min(ys)) - PAD),
            min(SIZE, math.ceil(max(xs)) + PAD), min(SIZE, math.ceil(max(ys)) + PAD))

def render(name, seen, box=None, with_ball=False, behind=(), without=()):
    """Only `seen` is visible to the camera; the rest still lights and shades it. `behind` cuts a hole where it is
    in front; `without` leaves the scene altogether."""
    for o in EVERY:
        o.visible_camera = o in seen or o in behind
        o.is_holdout = o in behind
    for o in EVERY:
        o.hide_render = o in without or (o in BALL and not with_ball)
    x0, y0, x1, y1 = box or (0, 0, SIZE, SIZE)
    r.use_border = r.use_crop_to_border = box is not None
    r.border_min_x, r.border_max_x = x0 / SIZE, x1 / SIZE
    r.border_min_y, r.border_max_y = 1 - y1 / SIZE, 1 - y0 / SIZE
    file = f'artlab-{name}.webp'
    r.filepath = str(OUT / file); bpy.ops.render.render(write_still=True)
    return {'file': file, 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0}

parts = {}
# Sprout stays in the backdrop pass unseen, so the shadow it casts on the porch is baked in. The ball moves, so its shadow is drawn.
parts['backdrop'] = render('backdrop', STATIC)
# Where the arm sinks into the body the body is unlit; the arm lifts off it, so the body is lit without the arm.
parts['body'] = render('body', BODY, bounds(BODY), without=ARM)
# The head sinks into the body: cut it where the body hides it, so its unlit underside never shows.
parts['head'] = render('head', HEAD, bounds(HEAD), behind=BODY)
# The arm swings wide, so it is rendered whole and lit as if the body and head were not there (no unlit inner side, no cut edge).
parts['arm'] = render('arm', ARM, bounds(ARM), without=BODY + HEAD)
parts['ball'] = render('ball', BALL, bounds(BALL), with_ball=True)
# Closed eyes: a patch of the head over the eye whites, with the eye pivots squashed as the 3D view does.
patch = bounds([o for o in HEAD if o.name.startswith('Eye cream')])
for e in eyes:
    e.scale.z = 0.12
bpy.context.view_layer.update()
parts['blink'] = render('blink', HEAD, patch, behind=BODY)

rest = ball.matrix_world.translation.copy()
ground = Vector((rest.x, rest.y, rest.z - 0.33))
manifest = {
    'size': SIZE, 'units': UNITS, 'parts': parts,
    'pivots': {'feet': px(sprout.matrix_world.translation), 'head': px(head.matrix_world.translation),
               'arm': px(arm.matrix_world.translation), 'ball': px(rest)},
    # The 3D view rolls the ball 1.1 units toward Sprout and 0.35 back (three.js -x, -z).
    'ballTravel': [a - b for a, b in zip(px(rest + Vector((-1.1, .35, 0))), px(rest))],
    'ballShadow': px(ground),
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=1) + '\n')
print('SPROUT_SPRITES_READY')
