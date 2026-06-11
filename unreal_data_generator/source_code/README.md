# Source Code

This folder contains the small C++ helper used by the Unreal Engine synthetic data generator.

## Files

- 'DatasetFileUtils.h'
- 'DatasetFileUtils.cpp'

These files expose a Blueprint callable function for saving text files from Unreal Engine. The generator uses this to export YOLO label files automatically. 

## Purpose

Unreal Blueprints do not provide a simple built-in node for writing string content to '.txt' files. This helper adds a custom Blueprint node that saves generated detection and segmentation labels to disk.

## Usage

In the Unreal project, these files should be placed inside the project's 'Source/[ProjectName]/' folder and compiled with the project.

After compiling, the Blueprint node can be used to save:

- YOLO object detection labels
- YOLO segmentation polygon labels