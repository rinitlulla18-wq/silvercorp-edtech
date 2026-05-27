import { Student, LeadStatus, ChatMessage, ServiceCategory, TaskStatus, Task } from '../types';
import { allCountries } from '../data/countries';

const firstNames = ['Aisha', 'Ben', 'Chloe', 'David', 'Emily', 'Finn', 'Grace', 'Henry', 'Isabella', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Penelope', 'Quinn', 'Ryan', 'Sophia', 'Thomas'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'White'];
const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'proton.me'];
const sampleNotes = [
    'Followed up on 2024-07-15. Interested in CS programs.',
    'Sent brochure for UK universities.',
    'Scheduled a consultation call for next week.',
    'Awaiting IELTS score.',
    'Application submitted to University of Toronto.',
    'Needs guidance on visa application process.',
    'Parental meeting conducted, financials look good.',
    'Interested in business analytics courses in Australia.',
    'Low GRE score, exploring alternative options.',
    'Confirmed admission at University of Berlin.'
];
const leadStatuses: LeadStatus[] = ['New', 'In Follow-up', 'Converted', 'Lost', 'Finalised'];
const serviceCategories: ServiceCategory[] = ['Document Editing', 'Abroad Education', 'Domestic Education', 'Visa Support', 'Test Prep', 'Profile Building', 'Education Loan', 'Other'];
const chatMessages = [
    "Hi, I'm interested in studying abroad. Can you help?",
    "Of course! Which country are you considering?",
    "I was thinking about Canada or Australia.",
    "Great choices! Do you have a specific field of study in mind?",
    "Yes, Computer Science.",
    "Excellent. I've sent you some information on top CS programs in both countries.",
    "Thank you so much! I'll review it and get back to you.",
    "You're welcome! Let me know if you have any questions.",
    "I have my IELTS scores now, they are 7.5 overall.",
    "That's a fantastic score! It opens up a lot of opportunities."
];

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const formatPhoneNumber = (): string => {
  const areaCode = Math.floor(Math.random() * 800) + 200;
  const firstPart = Math.floor(Math.random() * 900) + 100;
  const secondPart = Math.floor(Math.random() * 9000) + 1000;
  return `+1 (${areaCode}) ${firstPart}-${secondPart}`;
};

const generateRandomFollowUpDate = (): string => {
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 31) - 15; // -15 to +15 days from today
    today.setDate(today.getDate() + randomDays);
    return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

const generateRandomDate = (startDate: Date, endDate: Date): Date => {
    return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
};

const generateChatHistory = (createdDate: Date): ChatMessage[] => {
    const history: ChatMessage[] = [];
    const numMessages = Math.floor(Math.random() * 5) + 2; // 2 to 6 messages
    let lastDate = new Date(createdDate);

    for (let i = 0; i < numMessages; i++) {
        const newDate = generateRandomDate(lastDate, new Date());
        history.push({
            id: i,
            sender: i % 2 === 0 ? 'user' : 'agent',
            text: getRandomElement(chatMessages),
            timestamp: newDate.toISOString(),
            isFlagged: false,
        });
        lastDate = newDate;
    }
    return history.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export const generateSampleStudents = (count: number): Student[] => {
  const students: Student[] = [];
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  for (let i = 1; i <= count; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${getRandomElement(emailDomains)}`;
    const mobile = formatPhoneNumber();
    const avatarUrl = `https://picsum.photos/seed/${i}/40/40`;
    const studentId = `SC${1000 + i}`;
    
    const leadStatus = getRandomElement(leadStatuses);
    const serviceCategory = getRandomElement(serviceCategories);
    const followUpDate = generateRandomFollowUpDate();
    const createdDate = generateRandomDate(oneYearAgo, today);
    const chatHistory = generateChatHistory(createdDate);
    const lastModifiedDate = chatHistory.length > 0 ? new Date(chatHistory[chatHistory.length - 1].timestamp) : createdDate;
    const notes = chatHistory.length > 0 ? chatHistory.filter(m => m.sender === 'agent').pop()?.text ?? getRandomElement(sampleNotes) : getRandomElement(sampleNotes);

    // Assign 1 to 3 random, unique preferred countries
    const numCountries = Math.floor(Math.random() * 3) + 1;
    const shuffledCountries = [...allCountries].sort(() => 0.5 - Math.random());
    const preferredCountries = shuffledCountries.slice(0, numCountries);

    // Generate tasks
    const tasks: Task[] = [];
    
    // Generate detailed notes from main note
    const detailedNotes = [
        {
            id: i * 100 + 1,
            author: 'System',
            authorInitials: 'SYS',
            avatarBgColor: 'bg-gray-200',
            avatarTextColor: 'text-gray-700',
            timestamp: new Date(createdDate).toLocaleString(),
            text: `Lead created. Status: ${leadStatus}`
        },
        {
             id: i * 100 + 2,
             author: 'Agent',
             authorInitials: 'AG',
             avatarBgColor: 'bg-blue-100',
             avatarTextColor: 'text-blue-700',
             timestamp: new Date(lastModifiedDate).toLocaleString(),
             text: notes
        }
    ];

    students.push({
      id: i,
      studentId,
      fullName,
      email,
      mobile,
      preferredCountries,
      avatarUrl,
      notes,
      leadStatus,
      serviceCategory,
      followUpDate,
      createdDate: createdDate.toISOString(),
      lastModifiedDate: lastModifiedDate.toISOString(),
      chatHistory,
      emergencyContact: {
          name: `${lastName} Parent`,
          relation: 'Parent',
          email: `parent.${lastName.toLowerCase()}@example.com`,
          phone: formatPhoneNumber()
      },
      credentials: [],
      documents: [],
      tasks: tasks,
      detailedNotes: detailedNotes,
      history: [],
      completedJourneySteps: []
    });
  }
  return students;
};