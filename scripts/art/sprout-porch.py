"""Original Sprout art pilot. Blender 5.3: blender -b -t 4 --python scripts/art/sprout-porch.py
Rebuilds the editable blend, GLB and review still. No external assets or randomness.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/dev/sprout'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def material(name, color, rough=0.8):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=rough
    return m
mint=material('Sprout turquoise',(0.15,0.64,0.55)); cream=material('Warm cream',(0.96,0.85,0.59))
ink=material('Plum eyes',(0.045,0.022,0.032),0.19); white=material('Eye glints',(1,0.97,0.85),0.22)
blush=material('Petal pink',(0.94,0.43,0.40)); leaf=material('Leaf green',(0.44,0.68,0.12)); vein=material('Leaf vein',(0.20,0.42,0.12))
wood=material('Honey cedar',(0.53,0.29,0.14)); pale=material('Porch boards',(0.76,0.52,0.29)); dark=material('Deep teal',(0.055,0.22,0.19))
wall=material('Cottage plaster',(0.91,0.75,0.51)); roof=material('Terracotta',(0.61,0.22,0.14)); earth=material('Planter soil',(0.19,0.13,0.07))
grass=material('Sage grass',(0.41,0.56,0.31)); rim=material('Island edge',(0.24,0.35,0.22)); ballmat=material('Apricot ball',(0.98,0.46,0.19))

def group(name,loc=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o); o.location=loc; o.parent=parent; return o

def finish(o,name,mat,parent=None):
    o.name=name; o.data.materials.append(mat); o.parent=parent; return o

def orb(name,loc,scale,mat,parent=None,segments=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=12,location=loc);o=bpy.context.object;o.scale=scale
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,name,mat,parent)

def box(name,loc,scale,mat,bevel=.06,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('Soft edges','BEVEL');m.width=bevel;m.segments=2
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
        m=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=m.name)
    return finish(o,name,mat,parent)

def rod(name,a,b,r,mat,parent=None):
    d=Vector(b)-Vector(a);mid=(Vector(a)+Vector(b))/2
    bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=r,depth=d.length,location=mid);o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return finish(o,name,mat,parent)

def blade(name,start,end,width,parent=None):
    a=Vector(start);b=Vector(end);d=b-a;side=Vector((-d.z,0,d.x)).normalized()*width
    mid=a+d*.52; verts=[a,mid+side,b,mid-side,mid+Vector((0,-.13,0)),mid+Vector((0,.07,0))]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(1,0,5),(2,1,5),(3,2,5),(0,3,5)]);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,leaf,parent);rod(name+' vein',a,b,.018,vein,parent);return o

# Small diorama: modular boards and intentionally quiet scenery.
box('Island', (0,.4,-.12),(6,5.4,.5),rim,.3)
box('Lawn',(0,.4,.12),(5.95,5.35,.15),grass,.25)
for i in range(12):box('Porch plank',(0,-.1+i*.23,.27),(4.5,.215,.16),pale,.018)
box('Front step',(0,-.67,.19),(3.1,.52,.17),wood,.04)
box('Cottage',(0,2.45,1.62),(4.6,.35,2.65),wall)
for x in [-2.15,2.15]:box('Corner post',(x,2.19,1.65),(.16,.18,2.8),wood)
box('Window frame',(.75,2.20,1.9),(1.5,.12,1.3),wood)
box('Window dusk',(.75,2.12,1.9),(1.3,.08,1.1),dark,.02)
box('Window cross',(.75,2.04,1.9),(.055,.08,1.1),cream,.008)
box('Window bar',(.75,2.04,1.9),(1.3,.08,.055),cream,.008)
box('Window sill',(.75,2.04,1.24),(1.6,.35,.12),pale)
box('Door',(-1.25,2.18,1.4),(1,.15,2.1),dark,.12)
orb('Door knob',(-.94,2.04,1.35),(.06,.07,.06),cream)
for x in [-2.23,2.23]:rod('Porch post',(x,.75,.3),(x,.75,3.08),.065,wood)
awning=box('Porch roof',(0,1.8,3.18),(5.05,2.5,.18),roof);awning.rotation_euler.x=math.radians(12)
box('Roof edge',(0,.57,2.93),(5.1,.12,.15),wood)
for i in range(7):orb('Festoon',(-1.8+i*.6,.56,2.78+abs(i-3)*.035),(.045,.045,.065),cream,segments=12)
box('Planter',(1.8,.65,.56),(.65,.75,.5),roof)
box('Soil',(1.8,.65,.82),(.54,.63,.05),earth,.02)
for i in range(3):
    x=1.62+i*.18;rod('Plant stem',(x,.65,.84),(x,.65,1.13+i*.11),.02,vein)
    blade('Plant leaf',(x,.65,.94),(x+.24,.65,1.19+i*.1),.10)
    blade('Plant leaf',(x,.65,1.0),(x-.22,.65,1.28+i*.1),.11)
for x,y in [(-2.55,1.7),(2.45,2.4)]:
    rod('Tree trunk',(x,y,.2),(x,y,2.2),.1,wood)
    for z,r in [(1.6,.6),(2.1,.47),(2.55,.32)]:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=r,location=(x,y,z));finish(bpy.context.object,'Tree canopy',grass)
for x,y,s in [(-2.5,-1.4,.35),(2.1,-1.7,.3),(2.5,-.8,.2)]:orb('Stone',(x,y,.22),(s,s*.7,s*.45),cream,segments=10)

# Rigid parent pivots keep the prototype editable; no generated image textures.
sprout=group('Sprout',(-.65,-.05,.36))
orb('Body',(0,0,.7),(.64,.47,.72),mint,sprout)
orb('Belly',(0,-.407,.65),(.48,.09,.51),cream,sprout)
for x in [-.39,.39]:
    orb('Foot',(x,-.23,.13),(.29,.36,.17),mint,sprout)
    orb('Foot pad',(x,-.50,.16),(.14,.045,.10),blush,sprout)
head=group('Head',(0,0,1.43),sprout)
orb('Round head',(0,0,0),(.69,.49,.59),mint,head)
for x in [-.57,.57]:
    orb('Ear',(x,.0,.39),(.24,.15,.25),mint,head)
    orb('Ear inset',(x,-.128,.39),(.13,.035,.14),dark,head)
orb('Muzzle',(0,-.43,-.23),(.38,.095,.21),cream,head)
# Three eye styles to switch between in the art lab; only EyesClassic renders in stills. Each has two 'Eye' pivots for the blink.
STYLES={name:group(name,(0,0,0),head) for name in ['EyesClassic','EyesBead','EyesSoft']}
for x in [-.265,.265]:
    side=1 if x>0 else -1
    g=STYLES['EyesClassic']  # big glossy ovals in a cream ring, two glints
    orb('Eye cream',(x,-.443,.04),(.178,.075,.225),cream,g)
    eye=group('Eye', (x,-.50,.04),g)
    orb('Eye dark',(0,0,0),(.132,.059,.177),ink,eye)
    orb('Glint',(-.038,-.052,.065),(.047,.018,.055),white,eye)
    orb('Little glint',(.042,-.054,-.060),(.018,.012,.021),white,eye)
    g=STYLES['EyesBead']  # small round beads, set wider and lower
    eye=group('Eye',(side*.30,-.452,0),g)
    orb('Eye dark',(0,0,0),(.082,.05,.092),ink,eye)
    orb('Glint',(-.024,-.042,.034),(.024,.012,.026),white,eye)
    g=STYLES['EyesSoft']  # flat painted ovals, no ring, one glint
    eye=group('Eye',(side*.27,-.46,.03),g)
    orb('Eye dark',(0,0,0),(.108,.035,.150),ink,eye)
    orb('Glint',(-.03,-.03,.058),(.038,.014,.046),white,eye)
    orb('Cheek',(x*1.5,-.414,-.19),(.10,.025,.064),blush,head)
for name in ['EyesBead','EyesSoft']:
    for o in STYLES[name].children_recursive:o.hide_render=True
orb('Nose',(0,-.537,-.16),(.072,.04,.043),ink,head)
# Two short curves form the gentle smile.
for sign in [-1,1]:
    pts=[(0,-.535,-.20),(.05*sign,-.535,-.255),(.12*sign,-.517,-.25)]
    for a,b in zip(pts,pts[1:]):rod('Smile',a,b,.012,ink,head)
for x,name in [(-.61,'LeftArm'),(.61,'RightArm')]:
    arm=group(name,(x,0,1.0),sprout)
    orb('Arm',(0,-.05,-.20),(.19,.20,.36),mint,arm)
    orb('Paw',(0,-.20,-.39),(.12,.035,.10),cream,arm)
rod('Sprout stalk',(0,0,.48),(0,0,.94),.027,vein,head)
blade('Left leaf',(0,0,.70),(-.59,0,1.02),.22,head)
blade('Right leaf',(0,0,.78),(.57,0,1.12),.24,head)
ball=group('Ball',(1.05,-.72,.64))
orb('Ball orange',(0,0,0),(.33,.33,.33),ballmat,ball)
for z in [-.12,.12]:
    bpy.ops.mesh.primitive_torus_add(major_radius=math.sqrt(.33**2-z*z),minor_radius=.012,major_segments=32,minor_segments=6,location=(0,0,z));finish(bpy.context.object,'Ball stripe',cream,ball)

scene=bpy.context.scene
scene.world.color=(.25,.25,.25)
def area(name,loc,power,size):
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
area('Warm key',(-3,-4,7),850,5);area('Gentle fill',(4,-1,5),450,5)
bpy.ops.object.camera_add(location=(5,-8,5));cam=bpy.context.object;cam.rotation_euler=(Vector((0,.5,1.35))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=8;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.78,.66,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
scene.view_settings.view_transform='AgX'
# Only meshes and pivot empties enter the browser; lighting/camera set there for its viewport.
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in {'MESH','EMPTY'}:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'porch.glb'),use_selection=True,export_format='GLB',export_animations=False)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'porch.blend'))
scene.render.filepath=str(OUT/'porch.png');bpy.ops.render.render(write_still=True)
print('SPROUT_PORCH_READY')
