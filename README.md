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


