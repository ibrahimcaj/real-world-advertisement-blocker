# real-world-advertisement-blocker

<br> This project develops an AI-based system for detecting real-world advertisements in images and video streams and automatically filtering them by blurring the detected advertisement regions.
<br>The current implementation uses YOLOv8 object detection to locate advertisements and applies a blur effect to the predicted bounding boxes. The long-term goal is to create a system that can reduce unwanted visual advertising in recorded media, live video, and future AR or smart-glasses environments.
# Problem Definition & Motivation
Advertisements are present in many public and digital visual environments: billboards, posters, banners, shop signs, digital panels, street advertisements, and branded surfaces. When people take photos, record videos, or use AR devices, these advertisements often become part of the captured scene without the user having control over them.<br>
This creates several problems:<br>
**Lack of consumer control:** users cannot easily choose whether advertisements appear in their photos, videos, or visual field.<br>
**Cognitive overload:** dense public environments already contain a large amount of visual information, and advertisements add even more unnecessary content.<br>
**Visual pollution:** advertisements can dominate streets, buildings, and public spaces.<br>
**Branding issues:** unwanted logos and promotional content may appear in user-generated content.<br>
**AR and smart-glasses clutter:** future AR devices may make visual clutter even more noticeable if advertisements are not filtered.<br>
**Privacy and content moderation concerns:** recorded or streamed content may contain unwanted commercial or sensitive visual material.<br>

The problem addressed by this project is therefore:
How can we automatically detect real-world advertisements in images and video streams and visually filter them in real time?

# Proposed Solution
The proposed solution is a computer vision pipeline that detects advertisement regions and applies automatic visual filtering.<br>
The basic workflow is:<br>
Input image or video frame <br>
        ↓ <br>
YOLOv8 advertisement detection <br>
        ↓ <br>
Bounding box prediction<br>
        ↓ <br>
Blur detected advertisement regions <br>
        ↓ <br>
Filtered output image or video <br>

Instead of manually editing images or videos, the system automatically finds advertisement regions and blurs them. This makes the approach useful for both static images and video-based applications.

# Core Functionality
The current version of the project focuses on: <br>

detecting advertisements in real-world images <br>
detecting advertisements in video frames <br>
returning bounding boxes around detected ads <br>
blurring the detected advertisement regions <br>
testing the model on real, local, downloaded, and synthetic data <br>

The current main task is **object detection**. A segmentation-based version was also explored, but it is not yet reliable enough to be used as the final solution.

# Applications
Possible applications of this project include: <br>

**Content moderation:** removing or hiding unwanted advertisements from images or videos. <br>
**Privacy protection:** reducing the visibility of branded or promotional content in recorded media. <br>
**AR / smart glasses:** filtering visual clutter from real-world environments.<br>
**Automatic visual filtering:** blurring advertisement regions without manual editing.<br>
**Selective ad filtering:** detecting only specific types of advertisements, such as betting, alcohol, banners, billboards, panels, or digital screens. <br>
**Sponsorship-aware filtering:** using the same idea in reverse, for example blurring everything except selected sponsor advertisements. <br>

#  Current Status
The project currently includes: <br>
a YOLOv8-based object detection pipeline <br>
a combined dataset from multiple sources <br>
locally collected advertisement images from Bosnia & Herzegovina <br>
synthetic data generated using Blender and Unreal Engine 5.6 <br>
image and video inference experiments <br>
automatic blurring of detected advertisement bounding boxes <br>
an experimental segmentation approach that requires further improvement <br>

Final quantitative results will be added after model training and evaluation are completed. <br>

# Dataset & Data Preparation
To train and evaluate the advertisement detection model, we combined multiple data sources. This was done to make the dataset more diverse and to improve the model's ability to recognize advertisements in different environments, formats, lighting conditions, and camera perspectives.

The final dataset consists of approximately **2500 images** <br>
**OVDJE SAD FALI DIO**

**Outdoor Advertising Dataset**<br>
The primary dataset used in this project was an outdoor advertising dataset from Roboflow. This dataset provided more than 2200 labeled images and served as the foundation for training the initial advertisement detection model.<br>
This dataset was useful because it already contained real-world outdoor advertisement examples, including billboards, posters, panels, and other advertisement formats. However, because the visual appearance of advertisements can vary significantly between countries, cities, and environments, we decided to expand the dataset with additional local and synthetic examples.

**Locally Collected Dataset**<br>
To make the model more relevant to our environment, we collected an additional dataset of #111 real-world images# from Bosnia & Herzegovina. These images were taken in local streets, roads, and urban environments where advertisements appear in forms such as billboards, shop signs, posters, banners, and panels.<br>
This part of the dataset was important because advertisements in Bosnia & Herzegovina may differ from the downloaded dataset in terms of language, design style, placement, street layout, lighting, and background objects.<br>
The locally collected images were manually labeled by drawing bounding boxes around visible advertisement regions. These annotations were then prepared for YOLOv8 object detection training. **TREBA SPOMENUTI LABEL STUDIO I neke još**

**Synthetic Dataset**<br>
In addition to real-world data, we created a synthetic dataset of approximately 200 images using Unreal Engine 5.6. The goal of this dataset was to increase visual diversity and simulate real-world advertisement scenarios that may not appear often enough in the collected data.
The synthetic data generation process allowed us to control and vary different scene parameters, such as:
advertisement size
advertisement position
camera field of view
camera distance and angle
lighting conditions
environmental layout
weather conditions
occlusion level
day and night scenarios
This made it possible to create additional training examples in controlled but varied environments. Synthetic data was especially useful for testing the model on cases where advertisements appear under different conditions, such as unusual angles, partial occlusion, different scales, or different lighting.
This part of the project is documented separately in more detail:
unreal_data_generator/README.md
That README explains the Unreal Engine setup, procedural generation process, configurable parameters, and how the generated images and annotations are produced.

**Data Cleaning**<br>
Before training, the dataset was reviewed and cleaned. The preparation process included:
removing duplicate images
removing irrelevant or unusable images
checking whether advertisements were clearly visible
checking annotation quality
preparing the data in the correct YOLO format
organizing the dataset into training, validation, and testing subsets
This step was necessary to reduce noise in the dataset and improve the quality of the model training process.

<br>**Data Labeling**<br>
The labeling process focused on marking advertisement regions using bounding boxes. Each visible advertisement was labeled as an object that the YOLOv8 model should detect.
The locally collected dataset was manually labeled because these images did not already contain annotations. The downloaded dataset was also reviewed and adjusted where needed.
We also explored additional labeling for segmentation, where the goal was to mark the exact advertisement area instead of only a rectangular bounding box. However, the segmentation approach did not yet produce reliable enough results, so the current working version of the project focuses on object detection with bounding boxes.

<br>**Dataset Purpose**<br>
Using three different data sources helped us cover a wider range of advertisement appearances:
the downloaded dataset provided a large base of labeled outdoor advertisements
the locally collected dataset added examples from Bosnia & Herzegovina
the synthetic dataset added controlled variation through procedural generation
This combination was chosen to improve the model's ability to generalize to real-world images and videos.

# Model Architecture & Methodology 
**DODATI**
# Repository Structure 
Setup / Installation / How to Run, 
**DODATI**

# Current Limitations
Although the current object detection pipeline provides a functional first version of advertisement filtering, there are still several limitations.

<br>**Bounding Box Precision**<br>
The current system uses object detection, which means that advertisements are detected using rectangular bounding boxes. This works well for locating advertisements, but it is not always visually precise. If an advertisement has an irregular shape, the blur may also cover parts of the background around the ad.
A segmentation-based approach would be more precise because it could follow the exact borders of the advertisement. However, the current segmentation experiment does not yet produce reliable enough results for final use.

<br>**Segmentation Performance**<br>
We experimented with segmentation because it would allow cleaner and more accurate advertisement filtering. However, the segmentation model currently performs poorly in several cases, especially when advertisements are small, partially occluded, placed at difficult angles, or surrounded by complex backgrounds.
Because of this, segmentation is currently treated as an experimental direction rather than the main working solution.

<br>**Dataset Coverage**<br>
The combined dataset includes downloaded, locally collected, and synthetic images, but advertisements appear in many different formats and environments. The current dataset may still not cover all possible real-world cases, such as:
very small advertisements
heavily occluded advertisements
digital screens
unusual billboard shapes
advertisements at night
advertisements in bad weather
reflections or motion blur
text-heavy signs that are not advertisements
This means that the model may still fail or produce false detections in some real-world situations.

<br>**False Positives**<br>
The model may sometimes confuse advertisements with visually similar objects, such as shop signs, posters, road signs, banners, logos, or text-heavy surfaces. This is a difficult problem because the boundary between an advertisement and a regular sign is not always visually obvious.

<br>**Real-Time Performance**<br>
The project is designed with real-time or near-real-time filtering in mind, but the actual performance depends on the model size, input resolution, hardware, and video quality. Higher accuracy models may process frames more slowly, while smaller models may be faster but less accurate.

<br>**Synthetic Data Gap**<br>
Synthetic data is useful for increasing variation and testing controlled scenarios, but it cannot fully replace real-world data. Generated environments may still differ from real images in texture quality, lighting realism, object placement, and background complexity.
For this reason, synthetic data is used as an addition to real-world data, not as a full replacement.

# Future Work
Several improvements are planned for future versions of the project.
<br>**Improve Segmentation**<br>
One of the main future goals is to improve the segmentation model. A successful segmentation approach would allow the system to blur only the exact advertisement area instead of blurring the entire rectangular bounding box.
This would make the output cleaner and more visually accurate, especially for irregularly shaped advertisements, posters, banners, and signs.

<br>**Expand the Dataset**<br>
The dataset can be improved by collecting and labeling more real-world advertisement images. Future data collection should focus on difficult cases, such as:
night scenes
rainy or snowy conditions
low-light environments
small advertisements
partially hidden advertisements
digital billboards
advertisements from different cities and countries
different camera angles and distances
Adding more diverse examples would help the model generalize better to real-world images and videos.

<br>**Improve Synthetic Data Generation**<br>
The synthetic data generation pipeline can also be expanded. Future improvements could include more realistic environments, more advertisement formats, better lighting variation, more weather conditions, and more complex occlusion scenarios.
The synthetic generation system could also be used to create specific difficult examples that are rare in the real dataset.

<br>**Optimize for Real-Time Video**<br>
Future work should include optimization for real-time video processing. This could involve:
testing smaller YOLOv8 model variants
reducing input resolution
using GPU acceleration
improving frame processing speed
optimizing video reading and writing
testing the model on live camera input
This would make the project more suitable for real-time applications such as AR devices, smart glasses, or live video filtering.

<br>**Improve Evaluation**<br>
After the final training is completed, the model should be evaluated using standard object detection metrics such as precision, recall, mAP50, mAP50-95, and inference speed.
Future evaluation should also include visual comparisons on real images, synthetic images, and video examples. This would make it easier to understand not only the numerical performance of the model, but also its practical usefulness.

<br>**Deployment Possibilities**<br>
In the future, the project could be developed into a more complete application or prototype. Possible deployment directions include:
desktop image/video filtering tool
live webcam filtering
mobile application
browser-based demo
AR/smart-glasses prototype
content moderation pipeline
These directions would require additional optimization, testing, and user interface development.









