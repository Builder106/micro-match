"""Headless Blender build of a generic laptop with the live MicroMatch UI on screen.

Run:  blender -b -P laptop.py            → 60-frame ±35° sway loop to ../public/
      STILL=1 blender -b -P laptop.py    → single test still to test_still.png

Follows the marketing-trailer workflow: emission screen (strength 1.0),
dark-slate metallic 0.85 / roughness 0.4 body, Standard view transform (not
AgX), three-point lighting, transparent film, render at 2x display size.
"""

import bpy
import glob
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.normpath(os.path.join(HERE, "..", "public"))
TEX = os.path.join(PUBLIC, "mm_home.png")
STILL = os.environ.get("STILL") == "1"

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# --- Render settings ---------------------------------------------------------
scene.render.engine = "CYCLES"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = 2400
scene.render.resolution_y = 1600
scene.view_settings.view_transform = "Standard"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"
except Exception as e:
    print("GPU setup failed, falling back to CPU:", e)

# --- Materials ---------------------------------------------------------------
def slate(name, value, metallic, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*value, 1.0)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    return m

body_mat = slate("Body", (0.030, 0.036, 0.050), 0.85, 0.52)
well_mat = slate("KeyWell", (0.010, 0.012, 0.016), 0.10, 0.70)
pad_mat = slate("Trackpad", (0.05, 0.058, 0.075), 0.40, 0.50)

screen_mat = bpy.data.materials.new("Screen")
screen_mat.use_nodes = True
nodes = screen_mat.node_tree.nodes
links = screen_mat.node_tree.links
nodes.clear()
tex_node = nodes.new("ShaderNodeTexImage")
tex_node.image = bpy.data.images.load(TEX)
emit = nodes.new("ShaderNodeEmission")
emit.inputs["Strength"].default_value = 1.0
out = nodes.new("ShaderNodeOutputMaterial")
links.new(tex_node.outputs["Color"], emit.inputs["Color"])
links.new(emit.outputs["Emission"], out.inputs["Surface"])

# --- Geometry ----------------------------------------------------------------
def cube(name, sx, sy, sz, loc, mat):
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = (sx, sy, sz)
    o.data.materials.append(mat)
    return o

# Base deck: 34 x 23 x 1.5 cm, front toward -Y
base = cube("Base", 0.17, 0.115, 0.0075, (0, 0, 0.0075), body_mat)
bev = base.modifiers.new("Bevel", "BEVEL")
bev.width = 0.004
bev.segments = 4

# Keyboard well + trackpad, thin insets on the deck top
well = cube("KeyWell", 0.150, 0.062, 0.0006, (0, 0.030, 0.0155), well_mat)
pad = cube("Trackpad", 0.055, 0.036, 0.0006, (0, -0.068, 0.0155), pad_mat)

# Lid: 34 cm wide, 22.4 cm tall, 7 mm thick, standing up from the rear hinge
lid = cube("Lid", 0.17, 0.0035, 0.112, (0, 0.1115, 0.127), body_mat)
lbev = lid.modifiers.new("Bevel", "BEVEL")
lbev.width = 0.003
lbev.segments = 4

# Screen: 32 x 20 cm (16:10) emission plane on the lid's front face
bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0.1076, 0.127))
screen = bpy.context.active_object
screen.name = "ScreenPlane"
screen.rotation_euler = (math.radians(90), 0, 0)
screen.scale = (0.16, 0.10, 1)
screen.data.materials.append(screen_mat)

# Hinge assembly: lid + screen pivot together, tilted 15° back
bpy.ops.object.empty_add(location=(0, 0.1115, 0.015))
hinge = bpy.context.active_object
hinge.name = "Hinge"
for o in (lid, screen):
    o.select_set(True)
bpy.context.view_layer.objects.active = hinge
bpy.ops.object.parent_set(type="OBJECT", keep_transform=True)
hinge.rotation_euler.x = math.radians(-15)

# Root for the sway animation
bpy.ops.object.empty_add(location=(0, 0, 0))
root = bpy.context.active_object
root.name = "Root"
for o in (base, well, pad, hinge):
    o.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.object.parent_set(type="OBJECT", keep_transform=True)

# --- Camera ------------------------------------------------------------------
bpy.ops.object.empty_add(location=(0, 0.01, 0.10))
target = bpy.context.active_object
target.name = "CamTarget"

bpy.ops.object.camera_add(location=(0.0, -1.10, 0.42))
cam = bpy.context.active_object
cam.data.lens = 60
tr = cam.constraints.new("TRACK_TO")
tr.target = target
tr.track_axis = "TRACK_NEGATIVE_Z"
tr.up_axis = "UP_Y"
scene.camera = cam

# --- Three-point lighting + soft world ---------------------------------------
def area(name, loc, energy, size, rot=(0, 0, 0)):
    bpy.ops.object.light_add(type="AREA", location=loc, rotation=rot)
    L = bpy.context.active_object
    L.name = name
    L.data.energy = energy
    L.data.size = size
    c = L.constraints.new("TRACK_TO")
    c.target = target
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"
    return L

area("Key", (-0.55, -0.55, 0.55), 32, 1.2)
area("Fill", (0.60, -0.45, 0.30), 12, 0.7)
area("Rim", (0.05, 0.60, 0.55), 45, 0.6)

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.20, 0.21, 0.24, 1.0)
bg.inputs["Strength"].default_value = 0.5

# --- Sway animation: seamless ±35° sine loop, frame 61 == frame 1 -------------
scene.frame_start = 1
scene.frame_end = 60
for f in range(1, 62):
    t = (f - 1) / 60.0
    root.rotation_euler.z = math.radians(35.0) * math.sin(2 * math.pi * t)
    root.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

# --- Render ------------------------------------------------------------------
if STILL:
    scene.frame_set(8)  # a few degrees into the sway so depth reads
    scene.render.filepath = os.path.join(HERE, "test_still.png")
    bpy.ops.render.render(write_still=True)
    print("STILL DONE:", scene.render.filepath)
else:
    # Wipe any stale frames from a previous run before rendering fresh ones,
    # so a shorter re-render never leaves old high-numbered frames behind.
    for stale in glob.glob(os.path.join(PUBLIC, "mm_laptop_*.png")):
        os.remove(stale)
    scene.render.filepath = os.path.join(PUBLIC, "mm_laptop_")
    bpy.ops.render.render(animation=True)
    print("SEQUENCE DONE:", scene.render.filepath)
