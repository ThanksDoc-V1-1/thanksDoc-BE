# 🏥 ThanksDoc Backend API

A comprehensive healthcare service platform built with Strapi, featuring real-time WhatsApp notifications for doctors and businesses.

## 🚀 Quick Start

### Prerequisites
- Node.js (>= 18.x)
- npm or yarn
- MySQL/PostgreSQL database (optional)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run develop
```

The API will be available at `http://localhost:1337`

## 📱 WhatsApp Business API Integration

ThanksDoc includes innovative WhatsApp integration using Facebook's official WhatsApp Business API, providing cost-effective real-time notifications for doctors.

### 🎯 Key Advantages:
- **💰 Cost-effective**: ~$0.005-0.05 per conversation vs $0.05-0.10 per message with third-party services
- **🆓 Free tier**: 1,000 conversations per month
- **📞 Official API**: Direct integration with WhatsApp
- **📊 Better analytics**: Facebook's comprehensive reporting
- **🔄 Conversation-based pricing**: Multiple messages in 24 hours = 1 conversation

### Features
- ✅ Real-time WhatsApp notifications to nearby doctors
- 🔗 One-click Accept/Decline links
- 💬 Text-based responses ("ACCEPT" / "DECLINE")
- 🔒 Secure token-based authentication
- 📊 Delivery status tracking
- 🌍 Multi-language support ready
- 📱 Interactive message templates

### Setup WhatsApp Business API

1. **Create Facebook Business Account**
   ```bash
   # Sign up at https://business.facebook.com
   # Complete business verification
   ```

2. **Set Up WhatsApp Business API**
   ```bash
   # Go to https://developers.facebook.com
   # Create new app → Business → WhatsApp
   # Get Access Token, Phone Number ID, Business Account ID
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your WhatsApp Business API credentials
   ```

4. **Test WhatsApp Functionality**
   ```bash
   # Open the test page
   open http://localhost:1337/test-whatsapp.html
   ```

For detailed setup instructions, see [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md)

## 🏗️ API Endpoints

### Core Endpoints
- `GET /api/doctors` - List all doctors
- `GET /api/businesses` - List all businesses  
- `GET /api/service-requests` - List service requests

### Service Request Management
- `POST /api/service-requests/create` - Create new service request
- `PUT /api/service-requests/:id/accept` - Accept service request
- `PUT /api/service-requests/:id/reject` - Reject service request
- `PUT /api/service-requests/:id/complete` - Complete service request

### WhatsApp Integration
- `GET /api/service-requests/whatsapp-accept/:token` - Accept via WhatsApp link
- `GET /api/service-requests/whatsapp-reject/:token` - Reject via WhatsApp link
- `POST /api/service-requests/whatsapp-webhook` - Twilio webhook handler
- `POST /api/service-requests/test-whatsapp` - Test WhatsApp notifications

### Admin Utilities
- `POST /api/service-requests/admin/format-phone-numbers` - Format doctor phone numbers

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
