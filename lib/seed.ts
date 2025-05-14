import { db } from '@/db';
import { users, entrepreneurs, investors, collaborationRequests } from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';

export async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    // Clear existing data
    await db.delete(collaborationRequests);
    await db.delete(entrepreneurs);
    await db.delete(investors);
    await db.delete(users);
    
    console.log('✅ Cleared existing data');

    // Create users
    const hashedPassword = await hash('password123', 10);
    
    // Create admin user
    const adminId = createId();
    await db.insert(users).values({
      id: adminId,
      name: 'Admin User',
      email: 'admin@businessnexus.com',
      password: hashedPassword,
      role: 'admin',
    });
    
    // Create entrepreneur users
    const entrepreneurUsers = [
      {
        id: createId(),
        name: 'Sarah Johnson',
        email: 'sarah@ecotech.co',
        password: hashedPassword,
        role: 'entrepreneur' as const,
      },
      {
        id: createId(),
        name: 'David Smith',
        email: 'david@datasync.ai',
        password: hashedPassword,
        role: 'entrepreneur' as const,
      },
      {
        id: createId(),
        name: 'Lisa Taylor',
        email: 'lisa@medtech.io',
        password: hashedPassword,
        role: 'entrepreneur' as const,
      },
      {
        id: createId(),
        name: 'Michael Brown',
        email: 'michael@urbanfarm.co',
        password: hashedPassword,
        role: 'entrepreneur' as const,
      },
      {
        id: createId(),
        name: 'Jennifer Rodriguez',
        email: 'jennifer@finflow.com',
        password: hashedPassword,
        role: 'entrepreneur' as const,
      },
      {
        id: createId(),
        name: 'Robert Nguyen',
        email: 'robert@secureblock.com',
        password: hashedPassword,
        role: 'entrepreneur' as const,
      },
    ];
    
    await db.insert(users).values(entrepreneurUsers);
    console.log('✅ Created entrepreneur users');
    
    // Create investor users
    const investorUsers = [
      {
        id: createId(),
        name: 'Alex Thompson',
        email: 'alex@vcfund.com',
        password: hashedPassword,
        role: 'investor' as const,
      },
      {
        id: createId(),
        name: 'Jennifer Wu',
        email: 'jennifer.wu@investor.com',
        password: hashedPassword,
        role: 'investor' as const,
      },
      {
        id: createId(),
        name: 'Michael Brown',
        email: 'michael@growthpartners.com',
        password: hashedPassword,
        role: 'investor' as const,
      },
      {
        id: createId(),
        name: 'Sarah Garcia',
        email: 'sarah@techventures.com',
        password: hashedPassword,
        role: 'investor' as const,
      },
      {
        id: createId(),
        name: 'Daniel Kim',
        email: 'daniel@horizoncapital.com',
        password: hashedPassword,
        role: 'investor' as const,
      },
      {
        id: createId(),
        name: 'Rachel Patel',
        email: 'rachel@disruptventures.com',
        password: hashedPassword,
        role: 'investor' as const,
      },
    ];
    
    await db.insert(users).values(investorUsers);
    console.log('✅ Created investor users');
    
    // Query users to get their IDs for creating profiles
    const entrepreneurUserRecords = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role, // Add role to selected columns
      })
      .from(users)
      .where(eq(users.role, 'entrepreneur'));
      
    const investorUserRecords = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role, // Add role to selected columns
      })
      .from(users)
      .where(eq(users.role, 'investor'));
    
    // Create entrepreneur profiles
    const entrepreneurProfiles = [
      {
        id: createId(),
        userId: entrepreneurUserRecords[0].id,
        slug: 'sarah-johnson',
        name: entrepreneurUserRecords[0].name,
        avatar: '/user-placeholder.png',
        role: 'Founder & CEO',
        companyName: 'EcoTech Solutions',
        location: 'San Francisco, CA',
        email: entrepreneurUserRecords[0].email,
        website: 'https://ecotechsolutions.com',
        linkedin: 'linkedin.com/in/sarahjohnson',
        twitter: '@sarahj_ecotech',
        bio: "Serial entrepreneur with 10+ years of experience in sustainable technology. Previously founded GreenWave (acquired in 2021) and led product at CleanEnergy Corp. MSc in Environmental Engineering from Stanford University.",
        startupDescription: "EcoTech Solutions is developing innovative solar-powered water purification systems for regions with limited access to clean water. Our patented technology reduces energy consumption by 40% compared to traditional methods while delivering 99.9% purification.",
        fundingNeed: {
          amount: "$1.2M",
          stage: "Seed",
          use: "Product development, team expansion, and market testing in three pilot regions"
        },
      },
      {
        id: createId(),
        userId: entrepreneurUserRecords[1].id,
        slug: 'david-smith',
        name: entrepreneurUserRecords[1].name,
        avatar: '/user-placeholder.png',
        role: 'Co-founder & CTO',
        companyName: 'DataSync AI',
        location: 'Boston, MA',
        email: entrepreneurUserRecords[1].email,
        website: 'https://datasync.ai',
        linkedin: 'linkedin.com/in/davidsmith',
        twitter: '@david_ai',
        bio: "AI researcher turned entrepreneur with background in machine learning and data science. Previously led AI initiatives at Tech Giant Inc. PhD in Computer Science from MIT focusing on natural language processing.",
        startupDescription: "DataSync AI is building an enterprise data integration platform that uses artificial intelligence to automate data workflows. Our solution reduces data preparation time by 80% and significantly improves data quality for business intelligence and analytics.",
        fundingNeed: {
          amount: "$500K",
          stage: "Pre-seed",
          use: "Engineering team expansion and beta testing with enterprise customers"
        },
      },
      {
        id: createId(),
        userId: entrepreneurUserRecords[2].id,
        slug: 'lisa-taylor',
        name: entrepreneurUserRecords[2].name,
        avatar: '/user-placeholder.png',
        role: 'Founder & CEO',
        companyName: 'MedTech Innovations',
        location: 'Austin, TX',
        email: entrepreneurUserRecords[2].email,
        website: 'https://medtechinnovations.io',
        linkedin: 'linkedin.com/in/lisataylor',
        twitter: '@lisa_medtech',
        bio: "Healthcare professional with 15+ years of experience in medical device development. Previously VP of Product at MedicalDevices Corp and held clinical positions at leading hospitals. MD from Johns Hopkins and MBA from Wharton.",
        startupDescription: "MedTech Innovations is creating next-generation wearable diagnostic devices that provide continuous health monitoring and early disease detection. Our first product focuses on cardiac monitoring with AI-powered analytics for preventative healthcare.",
        fundingNeed: {
          amount: "$3M",
          stage: "Series A",
          use: "Clinical trials, regulatory approval process, and go-to-market strategy"
        },
      },
      {
        id: createId(),
        userId: entrepreneurUserRecords[3].id,
        slug: 'michael-brown',
        name: entrepreneurUserRecords[3].name,
        avatar: '/user-placeholder.png',
        role: 'Co-founder & CEO',
        companyName: 'Urban Farm Technologies',
        location: 'Portland, OR',
        email: entrepreneurUserRecords[3].email,
        website: 'https://urbanfarmtech.co',
        linkedin: 'linkedin.com/in/michaelbrown',
        twitter: '@mike_urbanfarm',
        bio: "Sustainability advocate and agricultural engineer with experience in developing vertical farming systems. Previously founded AgriSolutions (bootstrapped to profitability) and worked at leading agricultural research institutions.",
        startupDescription: "Urban Farm Technologies develops vertical farming solutions for urban areas, enabling local food production with minimal environmental impact. Our hydroponic systems use 95% less water and deliver 30% higher yields than traditional farming, while requiring 90% less land.",
        fundingNeed: {
          amount: "$750K",
          stage: "Seed",
          use: "Scaling production, securing patents, and expanding to three new metropolitan areas"
        },
      },
      {
        id: createId(),
        userId: entrepreneurUserRecords[4].id,
        slug: 'jennifer-rodriguez',
        name: entrepreneurUserRecords[4].name,
        avatar: '/user-placeholder.png',
        role: 'Founder & CEO',
        companyName: 'FinFlow',
        location: 'New York, NY',
        email: entrepreneurUserRecords[4].email,
        website: 'https://finflow.io',
        linkedin: 'linkedin.com/in/jenniferrodriguez',
        twitter: '@jen_finflow',
        bio: "Fintech entrepreneur with background in financial services and software development. Previously Head of Product at PaymentTech and software engineer at major financial institutions. MBA from Columbia Business School.",
        startupDescription: "FinFlow is building a next-generation financial management platform for small businesses, offering AI-powered bookkeeping, cash flow forecasting, and financial insights. Our platform integrates with existing accounting tools and bank accounts to provide real-time financial visibility.",
        fundingNeed: {
          amount: "$2.5M",
          stage: "Series A",
          use: "Expanding engineering team, enhancing AI capabilities, and aggressive customer acquisition"
        },
      },
      {
        id: createId(),
        userId: entrepreneurUserRecords[5].id,
        slug: 'robert-nguyen',
        name: entrepreneurUserRecords[5].name,
        avatar: '/user-placeholder.png',
        role: 'Co-founder & CTO',
        companyName: 'SecureBlock',
        location: 'Seattle, WA',
        email: entrepreneurUserRecords[5].email,
        website: 'https://secureblock.io',
        linkedin: 'linkedin.com/in/robertnguyen',
        twitter: '@robert_secureblk',
        bio: "Cybersecurity expert with 12+ years of experience in enterprise security and blockchain development. Previously led security at CryptoFinance and was a security architect at major tech companies. MS in Computer Security from Carnegie Mellon.",
        startupDescription: "SecureBlock is developing a blockchain-based security platform for enterprise applications, focusing on secure identity management and access control. Our solution provides immutable audit trails and zero-knowledge proofs for sensitive operations in regulated industries.",
        fundingNeed: {
          amount: "$1.8M",
          stage: "Seed",
          use: "Building out the core security framework, security certifications, and initial enterprise pilots"
        },
      },
    ];
    
    await db.insert(entrepreneurs).values(entrepreneurProfiles);
    console.log('✅ Created entrepreneur profiles');
    
    // Create investor profiles
    const investorProfiles = [
      {
        id: createId(),
        userId: investorUserRecords[0].id,
        slug: 'alex-thompson',
        name: investorUserRecords[0].name,
        avatar: '/user-placeholder.png',
        role: 'Partner',
        firmName: 'Venture Capital Fund',
        location: 'New York, NY',
        email: investorUserRecords[0].email,
        website: 'https://vcfund.com',
        linkedin: 'linkedin.com/in/alexthompson',
        twitter: '@alex_investor',
        bio: "Partner at Venture Capital Fund with 12+ years of investment experience. Previously funded three unicorns in the SaaS space. MBA from Harvard Business School and B.S. in Computer Science from MIT.",
        investmentInterests: ["SaaS", "AI", "Enterprise Software", "FinTech", "HealthTech"],
        portfolioCompanies: [
          {
            name: "DataSync AI",
            description: "AI-powered data integration platform",
            role: "Lead Investor, Series A",
            year: 2023
          },
          {
            name: "HealthMonitor",
            description: "Remote patient monitoring solution",
            role: "Seed Investor",
            year: 2022
          },
          {
            name: "FinanceFlow",
            description: "Automated bookkeeping software for SMBs",
            role: "Lead Investor, Seed",
            year: 2021
          },
          {
            name: "CloudSecure",
            description: "Zero-trust security platform",
            role: "Co-Investor, Series A",
            year: 2020
          }
        ],
      },
      {
        id: createId(),
        userId: investorUserRecords[1].id,
        slug: 'jennifer-wu',
        name: investorUserRecords[1].name,
        avatar: '/user-placeholder.png',
        role: 'Angel Investor',
        firmName: 'Independent',
        location: 'San Francisco, CA',
        email: investorUserRecords[1].email,
        website: 'https://jenniferwu.com',
        linkedin: 'linkedin.com/in/jenniferwu',
        twitter: '@jen_investor',
        bio: "Angel investor with focus on early-stage companies. Former entrepreneur with two successful exits in the e-commerce space. Actively mentors female founders through Women in Tech initiative.",
        investmentInterests: ["FinTech", "Sustainability", "D2C", "Marketplace"],
        portfolioCompanies: [
          {
            name: "EcoRetail",
            description: "Sustainable e-commerce platform",
            role: "Angel Investor",
            year: 2023
          },
          {
            name: "PaySmart",
            description: "Mobile payment solution for developing markets",
            role: "Lead Angel",
            year: 2022
          },
          {
            name: "FashionShare",
            description: "Peer-to-peer fashion rental marketplace",
            role: "Angel Investor",
            year: 2021
          }
        ],
      },
      {
        id: createId(),
        userId: investorUserRecords[2].id,
        slug: 'michael-brown-investor',
        name: investorUserRecords[2].name,
        avatar: '/user-placeholder.png',
        role: 'Managing Partner',
        firmName: 'Growth Partners',
        location: 'Chicago, IL',
        email: investorUserRecords[2].email,
        website: 'https://growthpartners.vc',
        linkedin: 'linkedin.com/in/michaelbrowninvestor',
        twitter: '@mike_gp_vc',
        bio: "Managing Partner at Growth Partners focusing on Series A and B investments. 15+ years of operational experience as COO of ScaleUp Inc (IPO 2019) and executive roles in high-growth tech companies.",
        investmentInterests: ["B2B", "MarketPlace", "E-commerce", "Logistics"],
        portfolioCompanies: [
          {
            name: "LogisticsPro",
            description: "AI-powered supply chain optimization",
            role: "Lead Investor, Series B",
            year: 2023
          },
          {
            name: "B2BMarket",
            description: "Enterprise procurement marketplace",
            role: "Lead Investor, Series A",
            year: 2022
          },
          {
            name: "ShipFast",
            description: "Last-mile delivery platform",
            role: "Follow-on Investment, Series B",
            year: 2021
          },
          {
            name: "RetailOS",
            description: "Omnichannel retail management software",
            role: "Lead Investor, Series A",
            year: 2020
          }
        ],
      },
      {
        id: createId(),
        userId: investorUserRecords[3].id,
        slug: 'sarah-garcia',
        name: investorUserRecords[3].name,
        avatar: '/user-placeholder.png',
        role: 'Investment Manager',
        firmName: 'Tech Ventures',
        location: 'Austin, TX',
        email: investorUserRecords[3].email,
        website: 'https://techventures.com',
        linkedin: 'linkedin.com/in/sarahgarcia',
        twitter: '@sarah_techvc',
        bio: "Investment Manager at Tech Ventures with focus on sustainable technology and clean energy. Previously worked in renewable energy project development and environmental consulting.",
        investmentInterests: ["CleanTech", "Sustainability", "AgTech", "IoT"],
        portfolioCompanies: [
          {
            name: "SolarPlus",
            description: "Next-gen solar panel technology",
            role: "Co-Investor, Seed",
            year: 2023
          },
          {
            name: "AquaSmart",
            description: "Water management IoT solutions",
            role: "Lead Investor, Seed",
            year: 2022
          },
          {
            name: "GreenBuild",
            description: "Sustainable building materials",
            role: "Investor, Series A",
            year: 2021
          }
        ],
      },
      {
        id: createId(),
        userId: investorUserRecords[4].id,
        slug: 'daniel-kim',
        name: investorUserRecords[4].name,
        avatar: '/user-placeholder.png',
        role: 'General Partner',
        firmName: 'Horizon Capital',
        location: 'Boston, MA',
        email: investorUserRecords[4].email,
        website: 'https://horizoncapital.vc',
        linkedin: 'linkedin.com/in/danielkim',
        twitter: '@daniel_horizon',
        bio: "General Partner at Horizon Capital focused on healthcare, biotech and life sciences. MD from Stanford and previously practiced medicine before transitioning to healthcare investing.",
        investmentInterests: ["HealthTech", "BioTech", "Medical Devices", "AI"],
        portfolioCompanies: [
          {
            name: "GenomeAI",
            description: "AI for genome sequencing analysis",
            role: "Lead Investor, Series B",
            year: 2023
          },
          {
            name: "MedicalAssist",
            description: "Robotic surgical assistants",
            role: "Lead Investor, Series A",
            year: 2022
          },
          {
            name: "BioMarker",
            description: "Novel cancer biomarker detection",
            role: "Co-Investor, Series C",
            year: 2021
          },
          {
            name: "HealthOS",
            description: "Hospital management platform",
            role: "Lead Investor, Series A",
            year: 2020
          }
        ],
      },
      {
        id: createId(),
        userId: investorUserRecords[5].id,
        slug: 'rachel-patel',
        name: investorUserRecords[5].name,
        avatar: '/user-placeholder.png',
        role: 'Founding Partner',
        firmName: 'Disrupt Ventures',
        location: 'Los Angeles, CA',
        email: investorUserRecords[5].email,
        website: 'https://disruptventures.co',
        linkedin: 'linkedin.com/in/rachelpatel',
        twitter: '@rachel_disrupt',
        bio: "Founding Partner at Disrupt Ventures focusing on consumer technology and digital media. Former Product Executive at major social media platforms and serial entrepreneur with experience building consumer brands.",
        investmentInterests: ["Consumer Apps", "Entertainment", "EdTech", "Social"],
        portfolioCompanies: [
          {
            name: "SocialNext",
            description: "AR-enabled social platform",
            role: "Seed Investor",
            year: 2023
          },
          {
            name: "LearnLoop",
            description: "Adaptive learning platform for K-12",
            role: "Lead Investor, Series A",
            year: 2022
          },
          {
            name: "StreamStudio",
            description: "Creator economy tools for livestreaming",
            role: "Lead Investor, Seed",
            year: 2021
          },
          {
            name: "MobileGames",
            description: "Casual mobile gaming studio",
            role: "Series A Investor",
            year: 2020
          }
        ],
      },
    ];
    
    await db.insert(investors).values(investorProfiles);
    console.log('✅ Created investor profiles');

    // Get entrepreneur IDs for collaboration requests
    const entrepreneurProfileRecords = await db.select().from(entrepreneurs);
    const investorProfileRecords = await db.select().from(investors);
    
    // Create a few collaboration requests between investors and entrepreneurs
    const collaborationRequestsData = [
      {
        id: createId(),
        investorId: investorProfileRecords[0].id,
        entrepreneurId: entrepreneurProfileRecords[2].id,
        status: 'pending' as const,
        message: "I'm interested in learning more about your medical device technology and would love to discuss potential investment opportunities.",
        createdAt: new Date('2025-04-22T10:30:00Z'),
        updatedAt: new Date('2025-04-22T10:30:00Z'),
      },
      {
        id: createId(),
        investorId: investorProfileRecords[1].id,
        entrepreneurId: entrepreneurProfileRecords[4].id,
        status: 'accepted' as const,
        message: "Your FinFlow platform aligns perfectly with my fintech investment focus. I'd like to explore how I can support your growth.",
        createdAt: new Date('2025-04-18T14:45:00Z'),
        updatedAt: new Date('2025-04-19T09:15:00Z'),
      },
      {
        id: createId(),
        investorId: investorProfileRecords[2].id,
        entrepreneurId: entrepreneurProfileRecords[1].id,
        status: 'rejected' as const,
        message: "I'm impressed by your DataSync AI solution and would like to discuss how it could fit in our B2B portfolio.",
        createdAt: new Date('2025-04-15T09:15:00Z'),
        updatedAt: new Date('2025-04-16T11:30:00Z'),
      },
      {
        id: createId(),
        investorId: investorProfileRecords[3].id,
        entrepreneurId: entrepreneurProfileRecords[0].id,
        status: 'pending' as const,
        message: "Your sustainable water purification technology is exactly the kind of innovation our fund looks for. Let's connect to discuss further.",
        createdAt: new Date('2025-04-25T16:20:00Z'),
        updatedAt: new Date('2025-04-25T16:20:00Z'),
      },
      {
        id: createId(),
        investorId: investorProfileRecords[4].id,
        entrepreneurId: entrepreneurProfileRecords[2].id,
        status: 'pending' as const,
        message: "As a healthcare-focused investor, I'm very interested in your medical diagnostics platform. Would love to learn more about your clinical trials and roadmap.",
        createdAt: new Date('2025-04-24T13:10:00Z'),
        updatedAt: new Date('2025-04-24T13:10:00Z'),
      },
    ];
    
    await db.insert(collaborationRequests).values(collaborationRequestsData);
    console.log('✅ Created collaboration requests');
    
    console.log('🎉 Database seeded successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return { success: false, error };
  }
}

// Run the seed function if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to seed database:', error);
      process.exit(1);
    });
}