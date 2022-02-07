# T.EX - The Transparency EXtension - v1

T.EX is a Web extension for Chrome and Chromium-based browsers to visualize data flows and relationships between websites. It is inspired by [Lightbeam](https://github.com/mozilla/lightbeam-we) for Firefox. The development of this Web extension has been discussed in the paper [Towards Real-Time Web Tracking Detection with T. EX-The Transparency EXtension](https://www.researchgate.net/profile/Sebastian-Zickau/publication/334745947_Towards_Real-Time_Web_Tracking_Detection_with_TEX_-_The_Transparency_EXtension/links/5d9c5f0892851c2f70f43b54/Towards-Real-Time-Web-Tracking-Detection-with-TEX-The-Transparency-EXtension.pdf).

## Deprecation Notice

This version of T.EX (T.EX-v1) is a proof of concept implementation, which is no longer maintained. It can be still used for demonstration purposes. For the most recent version of T.EX (T.EX-v2) check out [t-ex-tools/t.ex](https://github.com/t-ex-tools/t.ex).

## Installation

1. Clone or download the repository to your local drive
2. Open Chrome and navigate to **More tools** -> **Extensions**
3. Enable **Developer mode** *(switch on the upper right)*
4. Click on **Load unpacked**
5. Select the downloaded repository and click **Open**

## How to use

T.EX collects data in the background, while you browse the Web. To protect your data, T.EX uses encryption. In order to so, you have to create a key pair first before you can collect data. After you successfully installed the extension, click on the T.EX icon (see Figure 1, Step 1). T.EX will be opened in a new tab. Click on the gear icon at the bottom right of the screen (see Figure 1, Step 2). Afterwards the settings view will open. Click on *Generate key pair* (see Figure 1, Step 3) and then choose a password. You can now visit websites to collect data. To view the graph, open T.EX again by clicking on the T.EX icon or by reloading the tab T.EX was opened in.

![Ninhidrina fingerprint icon and popup](/t-ex-v1-how-to-use.png)
**Figure 1**

## References

The development of the Web extension and results of an analysis of the performance of the extension are discussed in the paper *Towards Real-Time Web Tracking Detection with T. EX-The Transparency EXtension* by Raschke and Küpper (2018). You can access the paper by clicking on this [link](https://www.researchgate.net/profile/Sebastian-Zickau/publication/334745947_Towards_Real-Time_Web_Tracking_Detection_with_TEX_-_The_Transparency_EXtension/links/5d9c5f0892851c2f70f43b54/Towards-Real-Time-Web-Tracking-Detection-with-TEX-The-Transparency-EXtension.pdf).
