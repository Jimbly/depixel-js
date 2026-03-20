Overview
========

# Depixelizing PixelArt in Realtime
This is the code documentation for my GPU accelerated implemenation of the <a href="http://research.microsoft.com/en-us/um/people/kopf/pixelart/">"depixelizing Pixel Art" paper by Johannens Kopf and Dani Lischinski</a>.
# Prerequisites
In order to successfully compile and run this this piece of sofware you need the following external libraries:

* <a href="http://www.glfw.org/">GLFW</a>
* <a href="http://glew.sourceforge.net/">GLEW</a>
* <a href="http://freeimage.sourceforge.net/">FreeImage</a>
* <a href="http://www.boost.org/doc/libs/1_55_0/doc/html/program_options.html">boost::program_options</a>

# Running the Programm
Start the program via the commandline using `GPUPixelArt.exe` this will show you a list of available program arguments.


The most common argument might be the `GPUPixelArt.exe -I somefile.png` argument which displays a single Depixelized Pixel Art image.

## Hotkeys

* F1 ... cycle debugging outputs
* F2 ... draw debug overlays (where available)
* F3 ... toggle B-Spline optimization
* SPACE ... pause sequence (where available)

# Coarse Structure & Data Flow
main.cpp contains initialization of the PixelArtRenderer class which is subsequently used in main rendering loop to draw frames

The PixelArtRenderer class is the core component of the rendering engine.
It controls all the dataflow for rendering a frame including texture unit management, input handling etc. 
When a frame is drawn it calls the draw() methods of the following classes:

* SimilarityGraphBuilder which computes a graph representing pixel connectivity called the Similarity Graph.
* CellGraphBuilder which computes B-Spline Control Points, defining the contours of the Depixelized Pixel Art.
* and finally GaussRasterizer which rasterizes the image and creates contours where the B-Splines are defined.


# How the rendering algorithms work:
As previously mentioned the rendering process consists of 3 stages:

## Similarity Graph Construction
This stage produces a Datastructure representing a regular grid containing connectivity information between pixels from the original Pixel Art image.
This grid is called the Similarity Graph (see <a href="http://research.microsoft.com/en-us/um/people/kopf/pixelart/">the original paper</a>) and it's constructed by connecting Pixels that have similar colors.

@see SimilarityGraphBuilder


## B-Spline Control Point Extraction and Optimization

@see CellGraphBuilder

### B-spline Control Point initialization
Once the Similarity Graph is ready the algorithm computes control points in between the connected regions emerged from the Similarity Graph.
### B-spline Control Point optimization
In order to smooth out the B-Spline curves a <a href="http://www.haoli.org/nr/bookcpdf/c10-1.pdf">Golden Section Search algorithm</a> is applied.

## Rasterization
The GaussRasterizer produces colored shapes with sharp contours defines by the B-Splines computed before and smooth transitions between non contour colored regions.


&copy; Felix Kreuzer, falichs@gmail.com
