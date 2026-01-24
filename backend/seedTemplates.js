const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// User schema (needed for creating system user)
const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    profileImage: String,
    bio: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Template schema
const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['blog', 'article', 'newsletter', 'report', 'other'],
        default: 'other'
    },
    content: {
        type: String,
        required: true,
        default: '<p>Start writing your template...</p>'
    },
    thumbnail: {
        type: String,
        default: ''
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Template = mongoose.model('Template', templateSchema);

// Sample templates
const templates = [
    {
        name: "Blog Post Template",
        description: "Perfect for writing engaging blog posts with images and formatting",
        category: "blog",
        isPublic: true,
        content: `<h1>Your Catchy Blog Title Here</h1><p><em>Published on [Date] by [Author Name]</em></p><p>&nbsp;</p><p>Start with a compelling introduction that hooks your readers. Explain what they'll learn from this post and why it matters to them.</p><p>&nbsp;</p><h2>Main Point #1</h2><p>Discuss your first main point here. Use clear, concise language and provide examples to illustrate your ideas.</p><ul><li><p>Key takeaway one</p></li><li><p>Key takeaway two</p></li><li><p>Key takeaway three</p></li></ul><p>&nbsp;</p><h2>Main Point #2</h2><p>Continue with your second main point. Break down complex ideas into digestible chunks.</p><p>&nbsp;</p><h2>Main Point #3</h2><p>Wrap up your main arguments here. Make sure each section flows naturally into the next.</p><p>&nbsp;</p><h2>Conclusion</h2><p>Summarize your key points and provide a clear call-to-action. What do you want readers to do next?</p><p>&nbsp;</p><p><strong>About the Author:</strong> [Your bio here]</p>`
    },
    {
        name: "Article Template",
        description: "Professional article format with structured sections",
        category: "article",
        isPublic: true,
        content: `<h1 style="text-align: center">Article Title: Make It Compelling</h1><p style="text-align: center"><em>By [Author Name] | [Date]</em></p><p>&nbsp;</p><h2>Introduction</h2><p>Begin with a strong opening paragraph that sets the context for your article. State your thesis or main argument clearly.</p><p>&nbsp;</p><h2>Background</h2><p>Provide necessary background information to help readers understand the topic. Include relevant statistics, historical context, or definitions.</p><p>&nbsp;</p><h2>Analysis</h2><p>This is the meat of your article. Present your analysis, arguments, or findings in a logical order.</p><ol><li><p>First major point with supporting evidence</p></li><li><p>Second major point with supporting evidence</p></li><li><p>Third major point with supporting evidence</p></li></ol><p>&nbsp;</p><h2>Discussion</h2><p>Discuss the implications of your findings or arguments. What do they mean for your readers?</p><p>&nbsp;</p><h2>Conclusion</h2><p>Wrap up your article by restating your main points and offering final thoughts or recommendations.</p><p>&nbsp;</p><p><strong>References:</strong></p><ul><li><p>Source 1</p></li><li><p>Source 2</p></li><li><p>Source 3</p></li></ul>`
    },
    {
        name: "Newsletter Template",
        description: "Engaging newsletter format for regular updates",
        category: "newsletter",
        isPublic: true,
        content: `<h1 style="text-align: center">📧 Newsletter Title</h1><p style="text-align: center"><em>Issue #[Number] | [Month Year]</em></p><p>&nbsp;</p><p>👋 <strong>Hello [Subscriber Name]!</strong></p><p>Welcome to this month's newsletter! Here's what we have in store for you:</p><p>&nbsp;</p><h2>🌟 Featured Story</h2><p>Your main story or announcement goes here. Make it exciting and valuable for your readers!</p><p>&nbsp;</p><h2>📰 Latest Updates</h2><ul><li><p><strong>Update 1:</strong> Brief description of what's new</p></li><li><p><strong>Update 2:</strong> Another exciting development</p></li><li><p><strong>Update 3:</strong> More news to share</p></li></ul><p>&nbsp;</p><h2>💡 Tip of the Month</h2><p>Share a valuable tip, trick, or insight that your subscribers will appreciate.</p><p>&nbsp;</p><h2>📅 Upcoming Events</h2><ul><li><p>[Event 1] - [Date]</p></li><li><p>[Event 2] - [Date]</p></li><li><p>[Event 3] - [Date]</p></li></ul><p>&nbsp;</p><h2>🎉 Community Spotlight</h2><p>Highlight a community member, customer success story, or user-generated content.</p><p>&nbsp;</p><p style="text-align: center">───────────────</p><p style="text-align: center"><em>Thank you for being part of our community!</em></p><p style="text-align: center">[Your Name/Company]</p>`
    },
    {
        name: "Product Review Template",
        description: "Comprehensive product review structure",
        category: "blog",
        isPublic: true,
        content: `<h1>[Product Name] Review: Is It Worth It?</h1><p><em>Reviewed on [Date] by [Reviewer Name]</em></p><p>&nbsp;</p><h2>⭐ Overall Rating: [X/5 Stars]</h2><p>&nbsp;</p><h2>📦 What's in the Box?</h2><p>List what comes with the product:</p><ul><li><p>Item 1</p></li><li><p>Item 2</p></li><li><p>Item 3</p></li></ul><p>&nbsp;</p><h2>🎯 Key Features</h2><ol><li><p><strong>Feature 1:</strong> Description and your thoughts</p></li><li><p><strong>Feature 2:</strong> Description and your thoughts</p></li><li><p><strong>Feature 3:</strong> Description and your thoughts</p></li></ol><p>&nbsp;</p><h2>✅ Pros</h2><ul><li><p>Major advantage 1</p></li><li><p>Major advantage 2</p></li><li><p>Major advantage 3</p></li></ul><p>&nbsp;</p><h2>❌ Cons</h2><ul><li><p>Drawback 1</p></li><li><p>Drawback 2</p></li><li><p>Drawback 3</p></li></ul><p>&nbsp;</p><h2>💰 Price & Value</h2><p>Discuss the pricing and whether it offers good value for money.</p><p>&nbsp;</p><h2>🎬 Performance</h2><p>Share your experience using the product. How did it perform in real-world conditions?</p><p>&nbsp;</p><h2>🏆 Final Verdict</h2><p>Summarize your overall thoughts. Who is this product best suited for? Would you recommend it?</p><p>&nbsp;</p><p><strong>Rating Breakdown:</strong></p><ul><li><p>Design: [X/5]</p></li><li><p>Performance: [X/5]</p></li><li><p>Value: [X/5]</p></li><li><p>Overall: [X/5]</p></li></ul>`
    },
    {
        name: "Tutorial Template",
        description: "Step-by-step tutorial guide format",
        category: "article",
        isPublic: true,
        content: `<h1>How to [Accomplish Task]: A Complete Guide</h1><p><em>By [Author] | Last updated: [Date]</em></p><p>&nbsp;</p><h2>📚 What You'll Learn</h2><p>In this tutorial, you'll learn how to:</p><ul><li><p>Skill/outcome 1</p></li><li><p>Skill/outcome 2</p></li><li><p>Skill/outcome 3</p></li></ul><p>&nbsp;</p><h2>🎯 Prerequisites</h2><p>Before you begin, make sure you have:</p><ul><li><p>Requirement 1</p></li><li><p>Requirement 2</p></li><li><p>Requirement 3</p></li></ul><p>&nbsp;</p><h2>⏱️ Estimated Time: [X minutes/hours]</h2><p>&nbsp;</p><h2>Step 1: [First Step Title]</h2><p>Detailed explanation of the first step. Include screenshots or images if helpful.</p><p>&nbsp;</p><h2>Step 2: [Second Step Title]</h2><p>Continue with clear, actionable instructions. Break down complex steps into smaller sub-steps if needed.</p><p>&nbsp;</p><h2>Step 3: [Third Step Title]</h2><p>Keep going with your tutorial. Use numbered lists for sequential actions:</p><ol><li><p>Do this first</p></li><li><p>Then do this</p></li><li><p>Finally do this</p></li></ol><p>&nbsp;</p><h2>Step 4: [Fourth Step Title]</h2><p>Continue adding steps as needed for your tutorial.</p><p>&nbsp;</p><h2>🎉 Conclusion</h2><p>Congratulations! You've successfully learned how to [accomplish task]. Here's a quick recap:</p><ul><li><p>Key point 1</p></li><li><p>Key point 2</p></li><li><p>Key point 3</p></li></ul><p>&nbsp;</p><h2>💡 Tips & Tricks</h2><ul><li><p>Helpful tip 1</p></li><li><p>Helpful tip 2</p></li><li><p>Helpful tip 3</p></li></ul><p>&nbsp;</p><h2>❓ Troubleshooting</h2><p><strong>Problem:</strong> Common issue 1</p><p><strong>Solution:</strong> How to fix it</p><p>&nbsp;</p><p><strong>Problem:</strong> Common issue 2</p><p><strong>Solution:</strong> How to fix it</p>`
    },
    {
        name: "Interview Template",
        description: "Professional interview article format",
        category: "article",
        isPublic: true,
        content: `<h1>Interview with [Guest Name]: [Compelling Subtitle]</h1><p><em>Interview conducted by [Interviewer] on [Date]</em></p><p>&nbsp;</p><h2>Introduction</h2><p>Introduce your guest and explain why readers should care about this interview. Provide brief background on the interviewee's expertise or achievements.</p><p>&nbsp;</p><h2>About [Guest Name]</h2><p>[Guest's bio, credentials, and relevant background information]</p><p>&nbsp;</p><h2>The Interview</h2><p>&nbsp;</p><p><strong>Q: [First Question]</strong></p><p><strong>[Guest Name]:</strong> [Their answer goes here. Make it conversational and authentic.]</p><p>&nbsp;</p><p><strong>Q: [Second Question]</strong></p><p><strong>[Guest Name]:</strong> [Their response]</p><p>&nbsp;</p><p><strong>Q: [Third Question]</strong></p><p><strong>[Guest Name]:</strong> [Their response]</p><p>&nbsp;</p><p><strong>Q: [Fourth Question]</strong></p><p><strong>[Guest Name]:</strong> [Their response]</p><p>&nbsp;</p><p><strong>Q: [Fifth Question]</strong></p><p><strong>[Guest Name]:</strong> [Their response]</p><p>&nbsp;</p><h2>Key Takeaways</h2><ul><li><p>Important insight 1</p></li><li><p>Important insight 2</p></li><li><p>Important insight 3</p></li></ul><p>&nbsp;</p><h2>Final Thoughts</h2><p>Wrap up the interview with your reflections on the conversation and what readers should take away from it.</p><p>&nbsp;</p><p><strong>Connect with [Guest Name]:</strong></p><ul><li><p>Website: [URL]</p></li><li><p>Twitter: [@handle]</p></li><li><p>LinkedIn: [Profile]</p></li></ul>`
    },
    {
        name: "Case Study Template",
        description: "Professional case study format with results",
        category: "report",
        isPublic: true,
        content: `<h1 style="text-align: center">Case Study: [Project/Company Name]</h1><p style="text-align: center"><em>[Subtitle describing the achievement]</em></p><p>&nbsp;</p><h2>📊 Executive Summary</h2><p>Provide a brief overview of the case study, including the main challenge, solution, and results.</p><p>&nbsp;</p><h2>🏢 Client Background</h2><p><strong>Company:</strong> [Company Name]</p><p><strong>Industry:</strong> [Industry]</p><p><strong>Size:</strong> [Company size]</p><p><strong>Location:</strong> [Location]</p><p>&nbsp;</p><h2>🎯 The Challenge</h2><p>Describe the problem or challenge the client was facing. Be specific about:</p><ul><li><p>What wasn't working</p></li><li><p>Why it was a problem</p></li><li><p>What they had tried before</p></li></ul><p>&nbsp;</p><h2>💡 The Solution</h2><p>Explain the approach taken to solve the problem:</p><ol><li><p><strong>Phase 1:</strong> Description of first phase</p></li><li><p><strong>Phase 2:</strong> Description of second phase</p></li><li><p><strong>Phase 3:</strong> Description of third phase</p></li></ol><p>&nbsp;</p><h2>🚀 Implementation</h2><p>Detail how the solution was implemented, including:</p><ul><li><p>Timeline</p></li><li><p>Resources used</p></li><li><p>Key milestones</p></li></ul><p>&nbsp;</p><h2>📈 Results</h2><p>Present the outcomes with specific metrics:</p><ul><li><p><strong>[X%]</strong> increase in [metric]</p></li><li><p><strong>[X%]</strong> improvement in [metric]</p></li><li><p><strong>[X%]</strong> reduction in [metric]</p></li></ul><p>&nbsp;</p><h2>💬 Client Testimonial</h2><p><em>"[Quote from client about their experience and results]"</em></p><p><strong>- [Name, Title, Company]</strong></p><p>&nbsp;</p><h2>🎓 Key Learnings</h2><ul><li><p>Lesson 1</p></li><li><p>Lesson 2</p></li><li><p>Lesson 3</p></li></ul><p>&nbsp;</p><h2>🏆 Conclusion</h2><p>Summarize the success of the project and its impact on the client's business.</p>`
    }
];

async function seedTemplates() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('Connected to MongoDB');

        // Find the first user to assign as author (or create a system user)
        let systemUser = await User.findOne({ email: 'system@bloghub.com' });

        if (!systemUser) {
            // Create a system user for templates
            systemUser = await User.create({
                name: 'BlogHub Templates',
                username: 'bloghub',
                email: 'system@bloghub.com',
                password: 'not-used-system-account',
            });
            console.log('Created system user for templates');
        }

        // Delete existing public templates from system user
        await Template.deleteMany({ author: systemUser._id, isPublic: true });
        console.log('Cleared existing system templates');

        // Insert new templates
        const templatesWithAuthor = templates.map(template => ({
            ...template,
            author: systemUser._id
        }));

        await Template.insertMany(templatesWithAuthor);
        console.log(`✅ Successfully seeded ${templates.length} templates!`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding templates:', error);
        process.exit(1);
    }
}

seedTemplates();
