# Nomad
### Your taste travels. Your life should too.

**An Agentic Cultural Relocation Engine Powered by Qloo**

## 1. The Problem

Moving to a new city or country is more than changing your address. It's leaving behind the cafes where you worked, the music venues you loved, the communities you belonged to, and the little routines that made your previous city feel like home.

For remote workers, international students and frequent movers, rebuilding that sense of familiarity and belonging can be difficult.

Existing discovery platforms offer generic, popularity-driven recommendations such as top-rated restaurants, popular cafes and tourist attractions. They understand what's nearby, but they don't understand the person searching.

Someone who loves independent bookstores, underground music venues and quiet creative cafes doesn't necessarily want the most popular commercial destinations in their new city.

**The missing piece is cultural understanding.**

## 2. Our Solution: Taste Transplant

Taste Transplant is an agentic relocation companion that helps people recreate their lifestyle and find a sense of belonging in a new city, anywhere in the world.

Instead of starting from scratch, users tell us where they're moving, share a few places they genuinely loved in their previous city, and provide their weekly availability, budget and preferences.

Powered by Qloo's cultural taste graph, Taste Transplant understands the cultural connections behind those places and discovers equivalent experiences in the destination city.

But we go beyond recommendations.

Our multi-agent system transforms these discoveries into a personalized, realistic weekly routine, balancing familiar experiences, new discoveries and opportunities to meet like-minded people.

Whether it's a work-friendly independent cafe on Monday, a community running club on Wednesday or an underground music venue on Friday, Taste Transplant helps users build a lifestyle that feels familiar while discovering what their new city has to offer.

**We don't just help people discover a new city. We help them make it feel like home.**

## 3. How It Works

### Step 1: Understand Your Lifestyle

Users enter their origin city, destination city and 3–5 places they genuinely loved in their previous city.

These could be cafes, restaurants, music venues, gyms, bookstores, art spaces or other cultural experiences.

They also provide their weekly availability, budget, preferred travel distance and social preferences.

### Step 2: Build Your Lifestyle DNA

Our Taste Profiling Agent uses Qloo's API to uncover the cultural signals, related entities, interests and cross-domain affinities associated with the user's favourite places.

It creates a structured Lifestyle DNA profile that represents what makes the user's preferences unique.

For example, someone might be identified as having strong affinities with independent culture, alternative music, creative spaces and community-oriented experiences.

### Step 3: Transfer Your Taste to a New City

This is the core of Taste Transplant.

Our Vibe Transfer Agent uses Qloo's cultural intelligence to discover destination-city experiences that align with the user's existing taste profile.

Instead of simply searching for another cafe because the user liked a cafe back home, it explores deeper cultural similarities across relevant entities and categories.

Each recommendation includes an explanation of why it matches the user's preferences.

### Step 4: Build Your Weekly Belonging Plan

Our Lifestyle Planning Agent combines culturally relevant recommendations with actual user availability, budget, location and travel constraints.

It creates a practical weekly schedule that balances two objectives:

- **Explore:** Discover places and experiences aligned with the user's existing interests.
- **Meet People:** Prioritize recurring activities, community spaces and social experiences that create opportunities for meaningful interactions.

Rather than overwhelming users with dozens of recommendations, the system prioritizes a smaller number of relevant experiences and recurring anchor spots.

### Step 5: Learn and Adapt

Taste Transplant doesn't stop after generating the first schedule.

At the end of each week, users provide feedback on their experiences.

They can mark places as loved, disliked, too expensive, too far away or simply not their vibe.

Our Feedback Agent incorporates these signals into future planning, continuously adapting recommendations as the user discovers new interests and develops a lifestyle in their new city.

## 4. Key Product Features

**Lifestyle DNA**

A personalized cultural preference profile generated from the user's favourite places and Qloo's cross-domain taste intelligence.

**Cultural Vibe Transfer**

Finds destination-city alternatives based on cultural affinities and shared taste signals rather than basic business categories.

**Agentic Weekly Planner**

Creates personalized weekly routines based on cultural fit, availability, budget, location and travel constraints.

**Explore vs. Meet People**

Categorizes experiences according to whether they primarily support independent exploration or opportunities for social interaction.

**Recurring Anchor Spots**

Prioritizes suitable recurring activities and familiar environments instead of overwhelming users with one-off recommendations.

**Trustworthy Recommendations**

Every suggested venue is checked against verified place data. The system transparently communicates when reliable matches or sufficient data are unavailable rather than inventing recommendations.

**Adaptive Taste Feedback**

Learns from user experiences and continuously improves future recommendations.

**Calendar & Social Integration**

Allows users to export their weekly plans to Google or Apple Calendar and generate personalized introduction messages for local communities, events and group chats.

## 5. Technical Architecture

Taste Transplant combines an agentic multi-step architecture with Qloo's cultural intelligence as its central recommendation engine.

The system consists of specialized agents:

1. **Taste Profiling Agent:** Processes favourite places and extracts cultural signals using Qloo.
2. **Vibe Transfer Agent:** Discovers relevant destination-city entities using Qloo's taste intelligence.
3. **Verification & Routing Agent:** Validates venues using external places data, checks geographical constraints and calculates practical travel routes.
4. **Lifestyle Planning Agent:** Optimizes experiences into a personalized weekly schedule.
5. **Feedback Agent:** Learns from user interactions and adapts future recommendations.

LangGraph orchestrates the agents and their decision-making workflow, while FastAPI manages backend services and API communication.

Qloo provides the cultural intelligence layer, while verified external data sources provide factual venue and geographical information. An LLM handles reasoning, explanations and structured output generation.

The architecture is designed to make recommendations explainable, practical and grounded in real-world data.

## 6. Target Audience

**Initial users:**

- International students moving to unfamiliar cities or countries.
- Remote workers and digital nomads who frequently relocate.
- Young professionals moving for new career opportunities.
- People relocating for education, work or personal reasons.

**Long-term opportunities:**

We envision Taste Transplant becoming a cultural integration platform for universities and enterprises.

Universities could use it to help international students discover relevant communities and experiences before and after arriving.

Companies could integrate it into employee relocation and onboarding programs, helping incoming employees establish social connections and adapt to unfamiliar environments.

## 7. Our Vision

Relocation platforms help people find homes, jobs and transportation. Discovery platforms help people find popular places.

But nobody really helps people rebuild the lifestyle they leave behind.

We believe that feeling at home in a new city shouldn't require starting your life from zero.

**Taste Transplant aims to make every new city feel a little less unfamiliar, one familiar experience at a time.**