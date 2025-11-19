## Getting Started

This project assumes you have already followed the instructions in [https://gitlab03.wpi.edu/heineman/hangman-2025](https://gitlab03.wpi.edu/heineman/hangman-2025) which creates the back-end cloud application.


## Install dependencies

This is a node.js project so you need to install dependent modules with the following command

`npm install`

## Configure to communicate with AWS backend

Inside the `src\app\aws.ts` file there is a reference to the API Gateway endpoint that you created using the `hangman-2025` git repository.

```
import axios from "axios"

// npm add axios

// all WEB traffic using this API instance
// Make sure that you update the URL below to match the Cloud Formation Stack API endpoint.
// and add the suffix "/hangman" at the end
export const instance = axios.create({
    baseURL: 'https://XXXXXXXXXXX.amazonaws.com/prod/hangman'
});
```

Now replace this URL with the proper URL from the CloudFormation API Endpoint.

## Launch GUI

Type `npm run dev` to launch the GUI server. Once done, open a browser and visit "localhost:3000" to see the GUI

The GUI will look like the following:

![Screenshot](public/screenshot.png "Hangman GUI")

## Hosting this application on an AWS S3 bucket

I modified the `package.json` file to include this important directive, that relative path names can be used when placed in S3.

```
  "homepage": ".",
```


I have pre-configured the `next.config.ts` file to specify that when you build this application, it will export all static pages to 
an `out` directory.

```
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export'
};

export default nextConfig;
```

Next build a static build of your react application using the command `npm run build`. This will package together an optimized directory that contains your application which can be hosted on a remote server. The result of this command is an `out` directory.


This directory contains all files (including images) and an all-important `_next` directory containing the static build

```
09/30/2025  03:52 PM             2,004 0.png
09/30/2025  03:52 PM             2,937 1.png
09/30/2025  03:52 PM             2,950 2.png
09/30/2025  03:52 PM             3,728 3.png
09/30/2025  03:52 PM             3,593 4.png
09/30/2025  03:52 PM             3,675 5.png
09/30/2025  03:52 PM             3,973 6.png
09/30/2025  03:52 PM             3,817 7.png
09/30/2025  05:39 PM            25,931 favicon.ico
09/30/2025  03:44 PM               391 file.svg
09/30/2025  03:44 PM             1,035 globe.svg
09/30/2025  05:39 PM             6,352 index.html
09/30/2025  05:39 PM             3,286 index.txt
09/30/2025  03:44 PM             1,375 next.svg
09/30/2025  03:44 PM               128 vercel.svg
09/30/2025  03:44 PM               385 window.svg
09/30/2025  05:39 PM             6,249 404.html
10/05/2025  09:52 AM    <DIR>          _next
```

These files all need to be uploaded a folder that you create within your AWS S3 bucket. Note that these files will all need to be world-readable so the application can be retrieved in any browser.

## Create a bucket in S3

Note that this bucket must be unique within the `us-east-1` region (or wherever you find yourself) and it doesn't really matter what the name is.  I called mine `hangman-api`. When you create, you have to make sure that you allow public access to the bucket. Note that this is a risk but only to the data contained within this bucket. Find the "Block Public Access settings for this bucket" and uncheck it, which means that you are allowing public access. Select the option that appears "I acknowledge that the current settings might result in this bucket and the objects within becoming public."

You will need to configure this bucket to be able to act like a static website hosting. To do so, select the bucket from the S3 dashboard and open the **Properties** tab. At the very bottom under `Static website hosting` choose **Edit**. Then select **Enable** and type "index.html" in the "Index document" field. Finally **Save changes**.

Within this bucket, choose the **Upload** button and first upload `_next` directory by selecting **Add folder** and browsing to your computer to the directory where `_next` is found. You will have to confirm an alert "Upload 24 files to this site?" Then click **Upload**. Close the green confirmation message and click on the **close** button or go back to the S3 service (at top level) and find this bucket again from your list of buckets.

Now you need to upload all of the individual files. Select **Upload** and this time choose **Add files**. Select all the sibling files that are in the same directory as `out` and choose to upload them all (there should be 18 of them).

## Ensure access to all files

Select the S3 buclet and choose the **Permissions** tab. Scroll down to the "Access control list (ACL)" area where you will see that "Bucket policy" is empty. Click **Edit** and set the policy to be:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::BUCKETNAME/*"
        }
    ]
}
```

Note that you will have to change BUCKETNAME in the above string.

## Launch application from the S3 bucket

Select the S3 bucket and choose the **Properties** tab to find the "bucket website endpoint" at the very end of this page.

It should be something like `"BUCKETNAME-api.s3-website-us-east-1.amazon.aws.com"`. Click on it to start playing Hangman!


