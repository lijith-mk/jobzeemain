import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { userType } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'JobZee',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          headerTitle: 'Browse Jobs',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💼</Text>,
          href: userType === 'user' ? '/(tabs)/jobs' : null,
        }}
      />
      
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Learn',
          headerTitle: 'Learning Hub',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📚</Text>,
          href: userType === 'user' ? '/(tabs)/courses' : null,
        }}
      />
      
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          headerTitle: 'Events',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎉</Text>,
          href: userType === 'user' ? '/(tabs)/events' : null,
        }}
      />
      
      <Tabs.Screen
        name="mentors"
        options={{
          title: 'Mentors',
          headerTitle: 'Find Mentors',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👨‍🏫</Text>,
          href: userType === 'user' ? '/(tabs)/mentors' : null,
        }}
      />
      
      <Tabs.Screen
        name="applications"
        options={{
          title: 'My Jobs',
          headerTitle: 'My Applications',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📝</Text>,
          href: userType === 'user' ? '/(tabs)/applications' : null,
        }}
      />
      
      <Tabs.Screen
        name="post-job"
        options={{
          title: 'Post Job',
          headerTitle: 'Create Job Posting',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>➕</Text>,
          href: userType === 'employer' ? '/(tabs)/post-job' : null,
        }}
      />
      
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'My Jobs',
          headerTitle: 'Manage Jobs',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📋</Text>,
          href: userType === 'employer' ? '/(tabs)/my-jobs' : null,
        }}
      />
      
      <Tabs.Screen
        name="employer-events"
        options={{
          title: 'Events',
          headerTitle: 'Manage Events',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎉</Text>,
          href: userType === 'employer' ? '/(tabs)/employer-events' : null,
        }}
      />
      
      <Tabs.Screen
        name="mentor-sessions"
        options={{
          title: 'Sessions',
          headerTitle: 'My Sessions',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👨‍🏫</Text>,
          href: userType === 'mentor' ? '/(tabs)/mentor-sessions' : null,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
