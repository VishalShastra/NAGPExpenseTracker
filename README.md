Expense Tracker:

Hello Guys !! its an expense tracker created for you based upon CSS,HTML,JS and Firebase authentication,FCM,Firestore and Firebase hosting,
Website link : https://vishalnagpassignment.web.app/

How to deploy in firebase :

Log In : Authenticate the Firebase CLI with your Google account:

firebase login
Check Your Projects : Verify the CLI is working correctly by listing your Firebase projects:

firebase projects:list
Make sure "vishalNAGPAssignment" is listed.

Initialize Firebase Hosting : Connect your local project files to your Firebase project:

firebase init hosting --project=vishalnagpassignment
Respond to the prompts as follows:

What do you want to use as your public directory? dist

Configure as a single-page app (rewrite all urls to /index.html)? Y

Set up automatic builds and deploys with GitHub? N

File public/index.html already exists. Overwrite? N

Deploy : Deploy your site to Firebase Hosting:

firebase deploy --only=hosting --project=vishalnagpassignment
Access Your App : Once the deploy is complete, Firebase provides two no-cost domains where your app is accessible:

vishalnagpassignment.web.app

vishalnagpassignment.firebaseapp.com
