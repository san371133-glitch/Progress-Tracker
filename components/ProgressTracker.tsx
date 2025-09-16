"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingUp, Target, BookOpen, Award, ChevronRight, ChevronLeft } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, onSnapshot, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

// Define the shape of our data for TypeScript
interface Entry {
  id: number;
  date: string;
  hours: string;
  notes: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  targetHours: number;
  color: string;
  entries: Entry[];
}

const ProgressTracker = () => {
  // Use the correct types for our state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newSkill, setNewSkill] = useState({ name: '', category: '', targetHours: 1, color: 'bg-blue-500' });
  const [newEntry, setNewEntry] = useState({ hours: '', notes: '', date: new Date().toISOString().split('T')[0] });

  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'];

  // Fetch data from Firestore
  useEffect(() => {
    const skillsCollection = collection(db, 'skills');
    const unsubscribe = onSnapshot(skillsCollection, (snapshot) => {
      const skillsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
      } as Skill));
      setSkills(skillsData);
    });
    return () => unsubscribe();
  }, []);
  
  // Add a new skill to the database
  const addSkill = async () => {
    if (newSkill.name && newSkill.category) {
      await addDoc(collection(db, 'skills'), { ...newSkill, entries: [] });
      setNewSkill({ name: '', category: '', targetHours: 1, color: 'bg-blue-500' });
      setShowAddSkill(false);
    }
  };

  // Add a new entry to a skill in the database
  const addEntry = async () => {
    if (selectedSkill && newEntry.hours && newEntry.notes) {
      const skillDocRef = doc(db, 'skills', selectedSkill.id);
      const entryWithId = { ...newEntry, id: Date.now() };
      await updateDoc(skillDocRef, { entries: arrayUnion(entryWithId) });
      setNewEntry({ hours: '', notes: '', date: new Date().toISOString().split('T')[0] });
      setShowAddEntry(false);
      setSelectedSkill(null);
    }
  };
  
  // The rest of the component's helper functions and JSX
  const getTotalHours = (skill: Skill) => (skill.entries || []).reduce((total, entry) => total + parseFloat(entry.hours || 0), 0);

  const getWeekProgress = (skill: Skill) => {
    const weekEntries = (skill.entries || []).filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });
    return weekEntries.reduce((total, entry) => total + parseFloat(entry.hours || 0), 0);
  };

  const getDayEntries = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayEntries: any[] = [];
    skills.forEach(skill => {
      const entries = (skill.entries || []).filter(entry => entry.date === dateStr);
      entries.forEach(entry => dayEntries.push({ ...entry, skillName: skill.name, skillColor: skill.color }));
    });
    return dayEntries;
  };

  const getDayTotalHours = (date: Date) => getDayEntries(date).reduce((total, entry) => total + parseFloat(entry.hours || 0), 0);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) { days.push({ date: new Date(year, month - 1, prevMonth.getDate() - i), isCurrentMonth: false }); }
    for (let day = 1; day <= daysInMonth; day++) { days.push({ date: new Date(year, month, day), isCurrentMonth: true }); }
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) { days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false }); }
    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const TabButton = ({ id, icon: Icon, label, isActive, onClick }: { id: string, icon: React.ElementType, label: string, isActive: boolean, onClick: (id: string) => void }) => ( <button onClick={() => onClick(id)} className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${ isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 border border-gray-200' }`}><Icon size={20} /><span>{label}</span></button> );

  const SkillCard = ({ skill, onClick }: { skill: Skill, onClick: (skill: Skill) => void }) => ( <div onClick={() => onClick(skill)} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:transform hover:scale-105"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className={`w-4 h-4 rounded-full ${skill.color}`}></div><h3 className="font-bold text-lg text-gray-800">{skill.name}</h3></div><span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{skill.category}</span></div><div className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Total Hours</span><span className="font-bold text-xl text-gray-800">{getTotalHours(skill).toFixed(1)}h</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">This Week</span><span className="font-semibold text-green-600">{getWeekProgress(skill).toFixed(1)}h</span></div><div className="bg-gray-200 rounded-full h-2 overflow-hidden"><div className={`h-full ${skill.color} transition-all duration-500`} style={{ width: `${Math.min((getTotalHours(skill) / (skill.targetHours * 10)) * 100, 100)}%` }}></div></div><div className="text-xs text-gray-500 text-center">Target: {skill.targetHours}h/day</div></div></div> );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* The rest of your JSX code for rendering the component */}
      <div className="bg-white shadow-sm border-b border-gray-200"><div className="max-w-6xl mx-auto px-6 py-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold text-gray-800 mb-2">Daily Progress Tracker</h1><p className="text-gray-600">Track your learning journey and celebrate your growth</p></div><div className="text-right"><div className="text-2xl font-bold text-blue-600">{new Date().toLocaleDateString()}</div><div className="text-sm text-gray-500">Today</div></div></div></div></div>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2"><TabButton id="overview" icon={Target} label="Overview" isActive={activeTab === 'overview'} onClick={setActiveTab} /><TabButton id="skills" icon={BookOpen} label="Skills" isActive={activeTab === 'skills'} onClick={setActiveTab} /><TabButton id="progress" icon={TrendingUp} label="Progress" isActive={activeTab === 'progress'} onClick={setActiveTab} /><TabButton id="calendar" icon={Calendar} label="Calendar" isActive={activeTab === 'calendar'} onClick={setActiveTab} /></div>
        {activeTab === 'overview' && (<div className="space-y-8"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white"><Award className="mb-4" size={32} /><div className="text-2xl font-bold mb-1">{skills.length}</div><div className="text-blue-100">Active Skills</div></div><div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white"><TrendingUp className="mb-4" size={32} /><div className="text-2xl font-bold mb-1">{skills.reduce((total, skill) => total + getWeekProgress(skill), 0).toFixed(1)}h</div><div className="text-green-100">This Week</div></div><div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white"><Calendar className="mb-4" size={32} /><div className="text-2xl font-bold mb-1">{skills.reduce((total, skill) => total + getTotalHours(skill), 0).toFixed(1)}h</div><div className="text-purple-100">Total Hours</div></div></div><div><h2 className="text-2xl font-bold text-gray-800 mb-6">Your Skills</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{skills.map(skill => <SkillCard key={skill.id} skill={skill} onClick={() => { setSelectedSkill(skill); setShowAddEntry(true); }} />)}<button onClick={() => setShowAddSkill(true)} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-300 flex items-center justify-center flex-col gap-3 text-gray-500 hover:text-blue-600"><Plus size={32} /><span className="font-semibold">Add New Skill</span></button></div></div></div>)}
        {showAddSkill && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl p-6 w-full max-w-md"><h3 className="text-xl font-bold text-gray-800 mb-4">Add New Skill</h3><div className="space-y-4"><div><label className="block text-sm font-semibold text-gray-700 mb-2">Skill Name</label><input type="text" value={newSkill.name} onChange={(e) => setNewSkill({...newSkill, name: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl" placeholder="e.g., Python Programming"/></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Category</label><input type="text" value={newSkill.category} onChange={(e) => setNewSkill({...newSkill, category: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl" placeholder="e.g., Programming"/></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Daily Target (hours)</label><input type="number" step="0.5" value={newSkill.targetHours} onChange={(e) => setNewSkill({...newSkill, targetHours: parseFloat(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-xl"/></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Color</label><div className="flex gap-2">{colors.map(color => <button key={color} onClick={() => setNewSkill({...newSkill, color})} className={`w-8 h-8 rounded-full ${color} ${newSkill.color === color ? 'ring-4 ring-gray-400' : ''}`} />)}</div></div></div><div className="flex gap-3 mt-6"><button onClick={() => setShowAddSkill(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Cancel</button><button onClick={addSkill} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg">Add Skill</button></div></div></div>)}
        {showAddEntry && selectedSkill && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl p-6 w-full max-w-md"><h3 className="text-xl font-bold text-gray-800 mb-4">Add Progress Entry</h3><p className="text-gray-600 mb-4">For: {selectedSkill.name}</p><div className="space-y-4"><div><label className="block text-sm font-semibold text-gray-700 mb-2">Date</label><input type="date" value={newEntry.date} onChange={(e) => setNewEntry({...newEntry, date: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl"/></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Hours Practiced</label><input type="number" step="0.25" value={newEntry.hours} onChange={(e) => setNewEntry({...newEntry, hours: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl" placeholder="1.5"/></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label><textarea value={newEntry.notes} onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl h-24 resize-none" placeholder="What did you learn or practice today?"/></div></div><div className="flex gap-3 mt-6"><button onClick={() => { setShowAddEntry(false); setSelectedSkill(null); }} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Cancel</button><button onClick={addEntry} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg">Save Entry</button></div></div></div>)}
      </div>
    </div>
  );
};

export default ProgressTracker;