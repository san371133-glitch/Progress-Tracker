"use client";

import React, 'react';
import { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingUp, Target, BookOpen, Award, ChevronRight, ChevronLeft } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, onSnapshot, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

// --- DEFINING THE DATA SHAPE ---
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
  // --- USING THE CORRECT TYPES IN useState ---
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newSkill, setNewSkill] = useState({ name: '', category: '', targetHours: 1, color: 'bg-blue-500' });
  const [newEntry, setNewEntry] = useState({ hours: '', notes: '', date: new Date().toISOString().split('T')[0] });

  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'];

  useEffect(() => {
    const skillsCollection = collection(db, 'skills');
    const unsubscribe = onSnapshot(skillsCollection, (snapshot) => {
      const skillsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        entries: doc.data().entries || [] 
      } as Skill)); // Asserting the type here
      setSkills(skillsData);
    });
    return () => unsubscribe();
  }, []);
  
  const addSkill = async () => {
    if (newSkill.name && newSkill.category) {
      await addDoc(collection(db, 'skills'), { ...newSkill, entries: [] });
      setNewSkill({ name: '', category: '', targetHours: 1, color: 'bg-blue-500' });
      setShowAddSkill(false);
    }
  };

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
  
  // ... The rest of the JSX and functions remain the same as before ...
  // (The full component code from the previous detailed guide is very long, so I'm omitting the unchanged JSX for brevity here, 
  // but the code block above contains all the necessary LOGIC changes)
};

export default ProgressTracker;