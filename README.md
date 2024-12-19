# One Post

One Post is an automated social media posting application designed to streamline the process of publishing content across multiple platforms, including LinkedIn, X (formerly Twitter), and Bluesky. By leveraging cutting-edge technologies like Gemini AI for content generation and OAuth for secure account integrations, One Post enables users to efficiently manage their social media presence.

## Features

### 1. User Authentication
- **OAuth Integration**: One Post uses secure OAuth protocols to connect with LinkedIn, X, and Bluesky, ensuring user data and account information remain protected.
- **Multi-Account Support**: Easily link accounts from multiple platforms to post simultaneously.

### 2. AI-Driven Post Generation
- **Gemini AI Integration**: Generate unique, platform-specific posts based on user prompts.
- **Customization Options**: Tailor posts with specific tones (e.g., professional, casual) and content types to suit your audience.

### 3. Multi-Platform Posting
- **Unified Posting**: Publish AI-generated posts to all connected platforms with one click.
- **Real-Time Feedback**: Receive status updates on the success of each platform’s posting.

### 4. Web Application
- **Next.js 14 Interface**: Enjoy a fast, user-friendly UI for creating and managing posts.
- **Post Scheduling**: Schedule posts to go live at a later date and time.
- **History and Analytics**: Track previously posted content and view engagement metrics (if supported by platform APIs).

### 5. Browser Extension
- **Quick Access**: Use the lightweight extension to generate and post content on the go.
- **Popup Interface**: Access the same powerful features of the web app directly from your browser toolbar.

## How It Works

### 1. Authentication
Users authenticate their accounts using OAuth:
- For LinkedIn: Securely log in and connect using LinkedIn’s latest APIs.
- For X: Authenticate via Twitter’s API to enable posting.
- For Bluesky: Provide your username and password for secure integration.

### 2. AI-Driven Post Creation
1. Enter a prompt in the web application or browser extension.
2. Select customization options like tone and audience.
3. One Post uses Gemini AI to generate a unique post tailored to each platform.

### 3. Posting Content
1. Choose the platforms to post on (LinkedIn, X, Bluesky).
2. Click the "Post" button to publish content across all selected platforms.
3. View real-time updates on posting status and errors, if any.

### 4. Post Scheduling
1. Choose a future date and time for the post.
2. One Post automatically publishes the content at the scheduled time.

### 5. Monitoring and Analytics
- View previously posted content in the history section.
- Analyze engagement metrics to refine future posts.

## Installation

### Prerequisites
- **Node.js** (v16 or later)
- **npm** or **yarn**

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/One Post.git
   cd One Post
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add environment variables:
   Create a `.env.local` file in the root directory and populate it with your API keys and credentials:
   ```plaintext
   LINKEDIN_CLIENT_ID=<your_linkedin_client_id>
   LINKEDIN_CLIENT_SECRET=<your_linkedin_client_secret>
   LINKEDIN_ACCESS_TOKEN=<your_access_token>
   LINKEDIN_ORGANIZATION_ID=<your_organization_id>
   TWITTER_BEARER_TOKEN=<your_twitter_bearer_token>
   BLUESKY_USERNAME=<your_bluesky_username>
   BLUESKY_PASSWORD=<your_bluesky_password>
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open the app in your browser:
   ```
   http://localhost:3000
   ```

## API Routes

### LinkedIn Posting
`POST /api/linkedin`
- Request Body:
  ```json
  {
    "text": "Your post content here."
  }
  ```
- Response:
  ```json
  {
    "data": "LinkedIn response details."
  }
  ```

### X (Twitter) Posting
`POST /api/twitter`
- Request Body:
  ```json
  {
    "text": "Your post content here."
  }
  ```
- Response:
  ```json
  {
    "data": "Twitter response details."
  }
  ```

### Bluesky Posting
`POST /api/bluesky`
- Request Body:
  ```json
  {
    "text": "Your post content here."
  }
  ```
- Response:
  ```json
  {
    "data": "Bluesky response details."
  }
  ```

## Technologies Used
- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Node.js, Serverless Architecture
- **AI**: Gemini AI for content generation
- **APIs**: LinkedIn API, Twitter API, Bluesky API

## Future Enhancements
- **Advanced Analytics**: Integrate deeper engagement metrics.
- **Content Templates**: Offer predefined templates for common post types.
- **Team Collaboration**: Allow multiple users to collaborate on posts.
- **Additional Platforms**: Expand support to include platforms like Instagram, Facebook, and TikTok.

## Contributing
We welcome contributions! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and open a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
