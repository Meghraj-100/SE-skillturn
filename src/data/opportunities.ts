export interface Opportunity {
    id: string;
    title: string;
    type: 'Project' | 'Internship';
    organization: string; // Faculty name or Company name
    description: string;
    skills: string[];
    postedDate: string;
    deadline: string;
}

export const opportunities: Opportunity[] = [
    {
        id: '1',
        title: 'AI-Driven Traffic Management System',
        type: 'Project',
        organization: 'Dr. Sarah Smith (CS Dept)',
        description: 'Developing a reinforcement learning model to optimize traffic signal timings in real-time using camera feeds.',
        skills: ['Python', 'PyTorch', 'Computer Vision'],
        postedDate: '2025-11-20',
        deadline: '2025-12-15',
    },
    {
        id: '2',
        title: 'Frontend Developer Intern',
        type: 'Internship',
        organization: 'TechFlow Solutions',
        description: 'Work on our core product dashboard using React and Next.js. Experience with modern UI libraries is a plus.',
        skills: ['React', 'Next.js', 'TypeScript', 'CSS'],
        postedDate: '2025-11-25',
        deadline: '2025-12-10',
    },
    {
        id: '3',
        title: 'Blockchain for Supply Chain',
        type: 'Project',
        organization: 'Prof. Alan Turing (IT Dept)',
        description: 'Research and implementation of a decentralized ledger for tracking pharmaceutical supply chains.',
        skills: ['Solidity', 'Ethereum', 'Web3.js'],
        postedDate: '2025-11-18',
        deadline: '2025-12-20',
    },
    {
        id: '4',
        title: 'Data Science Intern',
        type: 'Internship',
        organization: 'DataMinds Corp',
        description: 'Analyze large datasets to identify market trends. Proficiency in SQL and Pandas required.',
        skills: ['Python', 'SQL', 'Pandas', 'Tableau'],
        postedDate: '2025-11-22',
        deadline: '2025-12-05',
    },
    {
        id: '5',
        title: 'Smart Home Automation IoT',
        type: 'Project',
        organization: 'Dr. John Doe (EE Dept)',
        description: 'Building a prototype for a secure, low-power IoT network for smart home devices.',
        skills: ['C++', 'IoT', 'Embedded Systems', 'Network Security'],
        postedDate: '2025-11-26',
        deadline: '2025-12-30',
    },
    {
        id: '6',
        title: 'Predictive Student Performance Analytics',
        type: 'Project',
        organization: 'Dr. Aditi Verma (CS Dept)',
        description: 'A data analytics platform to predict student academic performance using historical data and machine learning models to enable early interventions. Looking for 4 team members.',
        skills: ['Python', 'Scikit-learn', 'Pandas', 'Streamlit'],
        postedDate: '2026-01-10',
        deadline: '2026-03-01',
    },
];
