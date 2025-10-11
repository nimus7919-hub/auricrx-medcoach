import AsyncStorage from '@react-native-async-storage/async-storage';
// Import with fallback for development
let Calendar: any = null;
let Notifications: any = null;

try {
  Calendar = require('expo-calendar');
} catch (error) {
  console.warn('expo-calendar not available:', error);
}

try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('expo-notifications not available:', error);
}
import SmartNotificationService from './smartNotifications';

export interface Appointment {
  id: string;
  title: string;
  type: 'doctor' | 'lab' | 'pharmacy' | 'specialist' | 'emergency' | 'follow_up' | 'checkup' | 'other';
  doctorName?: string;
  doctorSpecialty?: string;
  location: string;
  address?: string;
  phoneNumber?: string;
  startDate: string;
  endDate: string;
  duration: number; // in minutes
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  reminderMinutes: number[]; // Array of reminder times in minutes before appointment
  calendarEventId?: string; // For native calendar integration
  createdAt: string;
  updatedAt: string;
}

export interface DoctorContact {
  id: string;
  name: string;
  specialty: string;
  phoneNumber: string;
  countryCode: string;
  dialingMethod: 'phone' | 'whatsapp' | 'both';
  email?: string;
  address: string;
  clinicName?: string;
  notes?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  minutesBefore: number;
  notificationId: string;
  sent: boolean;
  sentAt?: string;
}

export interface AppointmentStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageAppointmentsPerMonth: number;
  mostFrequentType: string;
  nextAppointment?: Appointment;
}

class AppointmentService {
  private static instance: AppointmentService;
  private appointments: Appointment[] = [];
  private doctorContacts: DoctorContact[] = [];
  private reminders: AppointmentReminder[] = [];
  private smartNotifications: SmartNotificationService;
  private calendarPermissionGranted = false;

  static getInstance(): AppointmentService {
    if (!AppointmentService.instance) {
      AppointmentService.instance = new AppointmentService();
    }
    return AppointmentService.instance;
  }

  constructor() {
    try {
      this.smartNotifications = SmartNotificationService.getInstance();
    } catch (error) {
      console.warn('⚠️ Failed to initialize SmartNotificationService, continuing without it:', error);
      // Create a minimal mock service
      this.smartNotifications = {
        initialize: async () => {},
        addLocationReminder: async () => ({ id: 'mock', name: 'mock', latitude: 0, longitude: 0, radius: 100, message: 'mock', enabled: true }),
        deleteLocationReminder: async () => {},
        addWeatherAlert: async () => ({ id: 'mock', medicationId: 'mock', weatherCondition: 'pollen', threshold: 3, message: 'mock', enabled: true }),
        deleteWeatherAlert: async () => {},
        updateUsagePattern: async () => {},
        getSmartRefillPrediction: async () => null,
        getIntelligentReminderTime: async () => null,
        getLocationReminders: () => [],
        getWeatherAlerts: () => [],
        getUsagePatterns: () => new Map(),
        getCurrentLocation: () => null
      };
    }
  }

  // Generate or retrieve a unique user ID for database operations
  private async getOrCreateUserId(): Promise<string> {
    try {
      const USER_ID_KEY = 'AURIC_USER_ID';
      let userId = await AsyncStorage.getItem(USER_ID_KEY);
      
      if (!userId) {
        // Generate a unique anonymous user ID
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(USER_ID_KEY, userId);
        console.log('🆔 Generated new anonymous user ID:', userId);
      }
      
      return userId;
    } catch (error) {
      console.error('❌ Failed to get/create user ID:', error);
      // Fallback to a temporary ID
      return `temp_user_${Date.now()}`;
    }
  }

  async initialize() {
    try {
      // Load saved data first (this should always work)
      await this.loadSavedData();
      
      // Request permissions (don't fail if this doesn't work)
      try {
        await this.requestPermissions();
      } catch (error) {
        console.warn('⚠️ Permission request failed, continuing without permissions:', error);
      }
      
      console.log('✅ Appointment Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Appointment Service:', error);
      // Don't throw the error, just log it and continue
    }
  }

  private async requestPermissions() {
    try {
      // Request calendar permissions
      if (Calendar) {
        const { status: calendarStatus } = await Calendar.requestCalendarPermissionsAsync();
        this.calendarPermissionGranted = calendarStatus === 'granted';
      } else {
        console.warn('Calendar module not available - calendar features disabled');
        this.calendarPermissionGranted = false;
      }

      // Request notification permissions
      if (Notifications) {
        const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
        if (notificationStatus !== 'granted') {
          console.warn('Notification permission not granted');
        }
      } else {
        console.warn('Notifications module not available - notification features disabled');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }

  private async loadSavedData() {
    try {
      const [appointmentsData, doctorsData, remindersData] = await Promise.all([
        AsyncStorage.getItem('appointments'),
        AsyncStorage.getItem('doctor_contacts'),
        AsyncStorage.getItem('appointment_reminders')
      ]);

      if (appointmentsData) {
        this.appointments = JSON.parse(appointmentsData);
      }
      if (doctorsData) {
        this.doctorContacts = JSON.parse(doctorsData);
      }
      if (remindersData) {
        this.reminders = JSON.parse(remindersData);
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }

  private async saveData() {
    try {
      await Promise.all([
        AsyncStorage.setItem('appointments', JSON.stringify(this.appointments)),
        AsyncStorage.setItem('doctor_contacts', JSON.stringify(this.doctorContacts)),
        AsyncStorage.setItem('appointment_reminders', JSON.stringify(this.reminders))
      ]);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // Appointment Management
  async createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.appointments.push(newAppointment);
    await this.saveData();

    // Create calendar event if permission granted
    if (this.calendarPermissionGranted) {
      try {
        const calendarEventId = await this.createCalendarEvent(newAppointment);
        newAppointment.calendarEventId = calendarEventId;
        await this.saveData();
      } catch (error) {
        console.error('Failed to create calendar event:', error);
      }
    }

    // Schedule reminders
    await this.scheduleReminders(newAppointment);

    return newAppointment;
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    const index = this.appointments.findIndex(appt => appt.id === id);
    if (index === -1) return null;

    this.appointments[index] = {
      ...this.appointments[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveData();

    // Update calendar event if it exists
    if (this.appointments[index].calendarEventId && this.calendarPermissionGranted) {
      try {
        await this.updateCalendarEvent(this.appointments[index]);
      } catch (error) {
        console.error('Failed to update calendar event:', error);
      }
    }

    // Reschedule reminders
    await this.rescheduleReminders(this.appointments[index]);

    return this.appointments[index];
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const appointment = this.appointments.find(appt => appt.id === id);
    if (!appointment) return false;

    // Cancel reminders
    await this.cancelReminders(id);

    // Delete calendar event if it exists
    if (appointment.calendarEventId && this.calendarPermissionGranted) {
      try {
        await this.deleteCalendarEvent(appointment.calendarEventId);
      } catch (error) {
        console.error('Failed to delete calendar event:', error);
      }
    }

    this.appointments = this.appointments.filter(appt => appt.id !== id);
    await this.saveData();
    return true;
  }

  async getAppointments(filters?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Appointment[]> {
    let filtered = [...this.appointments];

    if (filters) {
      if (filters.status) {
        filtered = filtered.filter(appt => appt.status === filters.status);
      }
      if (filters.type) {
        filtered = filtered.filter(appt => appt.type === filters.type);
      }
      if (filters.startDate) {
        filtered = filtered.filter(appt => appt.startDate >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(appt => appt.startDate <= filters.endDate!);
      }
    }

    return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  async getUpcomingAppointments(days: number = 30): Promise<Appointment[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return this.getAppointments({
      status: 'scheduled',
      startDate: now.toISOString(),
      endDate: futureDate.toISOString()
    });
  }

  async getAppointmentStats(): Promise<AppointmentStats> {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalAppointments = this.appointments.length;
    const upcomingAppointments = this.appointments.filter(appt => 
      appt.status === 'scheduled' && new Date(appt.startDate) > now
    ).length;
    const completedAppointments = this.appointments.filter(appt => 
      appt.status === 'completed'
    ).length;
    const cancelledAppointments = this.appointments.filter(appt => 
      appt.status === 'cancelled'
    ).length;

    // Calculate average appointments per month
    const recentAppointments = this.appointments.filter(appt => 
      new Date(appt.startDate) >= oneMonthAgo
    );
    const averageAppointmentsPerMonth = recentAppointments.length;

    // Find most frequent appointment type
    const typeCounts = this.appointments.reduce((acc, appt) => {
      acc[appt.type] = (acc[appt.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostFrequentType = Object.keys(typeCounts).reduce((a, b) => 
      typeCounts[a] > typeCounts[b] ? a : b, 'doctor'
    );

    // Find next appointment
    const nextAppointment = this.appointments
      .filter(appt => appt.status === 'scheduled' && new Date(appt.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

    return {
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      averageAppointmentsPerMonth,
      mostFrequentType,
      nextAppointment
    };
  }

  // Doctor Contact Management
  async addDoctorContact(doctorData: Omit<DoctorContact, 'id' | 'createdAt'>): Promise<DoctorContact> {
    const newDoctor: DoctorContact = {
      ...doctorData,
      id: `doctor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    // Save to AsyncStorage for local access
    this.doctorContacts.push(newDoctor);
    await this.saveData();

    // Also save to database for persistence and data collection
    try {
      const { saveUserDoctor } = require('../../server/neon');
      const userId = await this.getOrCreateUserId();
      
      await saveUserDoctor(userId, {
        doctorName: newDoctor.name,
        specialty: newDoctor.specialty,
        phoneNumber: newDoctor.phoneNumber,
        email: newDoctor.email || '',
        address: newDoctor.address,
        notes: newDoctor.notes || '',
        preferredContactMethod: newDoctor.dialingMethod,
        countryCode: newDoctor.countryCode
      });
      
      console.log('✅ Doctor contact saved to database:', newDoctor.name);
    } catch (error) {
      console.warn('⚠️ Failed to save doctor contact to database (continuing with local storage):', error);
      // Continue with local storage even if database save fails
    }

    return newDoctor;
  }

  async updateDoctorContact(id: string, updates: Partial<DoctorContact>): Promise<DoctorContact | null> {
    const index = this.doctorContacts.findIndex(doctor => doctor.id === id);
    if (index === -1) return null;

    this.doctorContacts[index] = { ...this.doctorContacts[index], ...updates };
    await this.saveData();

    // Also update in database for persistence
    try {
      const { saveUserDoctor } = require('../../server/neon');
      const userId = await this.getOrCreateUserId();
      
      await saveUserDoctor(userId, {
        doctorName: this.doctorContacts[index].name,
        specialty: this.doctorContacts[index].specialty,
        phoneNumber: this.doctorContacts[index].phoneNumber,
        email: this.doctorContacts[index].email || '',
        address: this.doctorContacts[index].address,
        notes: this.doctorContacts[index].notes || '',
        preferredContactMethod: this.doctorContacts[index].dialingMethod,
        countryCode: this.doctorContacts[index].countryCode
      });
      
      console.log('✅ Doctor contact updated in database:', this.doctorContacts[index].name);
    } catch (error) {
      console.warn('⚠️ Failed to update doctor contact in database (continuing with local storage):', error);
    }

    return this.doctorContacts[index];
  }

  async deleteDoctorContact(id: string): Promise<boolean> {
    // Find the doctor before deleting to save deletion record
    const doctorToDelete = this.doctorContacts.find(doctor => doctor.id === id);
    
    // Remove from local storage
    this.doctorContacts = this.doctorContacts.filter(doctor => doctor.id !== id);
    await this.saveData();

    // Save deletion record to database (but keep the original doctor record for data collection)
    if (doctorToDelete) {
      try {
        const { saveUserDoctor } = require('../../server/neon');
        const userId = await this.getOrCreateUserId();
        
        // Save a deletion record with a special note
        await saveUserDoctor(userId, {
          doctorName: doctorToDelete.name,
          specialty: doctorToDelete.specialty,
          phoneNumber: doctorToDelete.phoneNumber,
          email: doctorToDelete.email || '',
          address: doctorToDelete.address,
          notes: `[DELETED ${new Date().toISOString()}] ${doctorToDelete.notes || ''}`,
          preferredContactMethod: doctorToDelete.dialingMethod,
          countryCode: doctorToDelete.countryCode
        });
        
        console.log('✅ Doctor contact deletion recorded in database:', doctorToDelete.name);
      } catch (error) {
        console.warn('⚠️ Failed to record doctor deletion in database:', error);
      }
    }

    return true;
  }

  async getDoctorContacts(): Promise<DoctorContact[]> {
    return [...this.doctorContacts].sort((a, b) => {
      // Primary doctors first, then by name
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  async getPrimaryDoctor(): Promise<DoctorContact | null> {
    return this.doctorContacts.find(doctor => doctor.isPrimary) || null;
  }

  // Calendar Integration
  private async createCalendarEvent(appointment: Appointment): Promise<string> {
    if (!Calendar) {
      console.warn('Calendar module not available - skipping calendar event creation');
      return '';
    }

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];
      
      if (!defaultCalendar) {
        throw new Error('No writable calendar found');
      }

      const eventDetails = {
        title: appointment.title,
        startDate: new Date(appointment.startDate),
        endDate: new Date(appointment.endDate),
        location: appointment.location,
        notes: appointment.notes || '',
        alarms: appointment.reminderMinutes.map(minutes => ({
          relativeOffset: -minutes,
          method: Calendar.AlarmMethod.ALERT
        }))
      };

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
      return eventId;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  private async updateCalendarEvent(appointment: Appointment): Promise<void> {
    if (!appointment.calendarEventId || !Calendar) return;

    try {
      const eventDetails = {
        title: appointment.title,
        startDate: new Date(appointment.startDate),
        endDate: new Date(appointment.endDate),
        location: appointment.location,
        notes: appointment.notes || '',
        alarms: appointment.reminderMinutes.map(minutes => ({
          relativeOffset: -minutes,
          method: Calendar.AlarmMethod.ALERT
        }))
      };

      await Calendar.updateEventAsync(appointment.calendarEventId, eventDetails);
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  }

  private async deleteCalendarEvent(eventId: string): Promise<void> {
    if (!Calendar) return;

    try {
      await Calendar.deleteEventAsync(eventId);
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }

  // Reminder Management
  private async scheduleReminders(appointment: Appointment): Promise<void> {
    if (!Notifications) {
      console.warn('Notifications module not available - skipping reminder scheduling');
      return;
    }

    for (const minutesBefore of appointment.reminderMinutes) {
      try {
        const triggerDate = new Date(new Date(appointment.startDate).getTime() - minutesBefore * 60 * 1000);
      
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `📅 Appointment Reminder`,
            body: `${appointment.title} in ${minutesBefore} minutes`,
            data: {
              appointmentId: appointment.id,
              type: 'appointment_reminder'
            }
          },
          trigger: triggerDate
        });

        const reminder: AppointmentReminder = {
          id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          appointmentId: appointment.id,
          minutesBefore,
          notificationId,
          sent: false
        };

        this.reminders.push(reminder);
      } catch (error) {
        console.error('Failed to schedule reminder:', error);
      }
    }

    await this.saveData();
  }

  private async rescheduleReminders(appointment: Appointment): Promise<void> {
    // Cancel existing reminders
    await this.cancelReminders(appointment.id);
    
    // Schedule new reminders
    await this.scheduleReminders(appointment);
  }

  private async cancelReminders(appointmentId: string): Promise<void> {
    if (!Notifications) return;

    const appointmentReminders = this.reminders.filter(reminder => reminder.appointmentId === appointmentId);
    
    for (const reminder of appointmentReminders) {
      try {
        await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      } catch (error) {
        console.error('Failed to cancel reminder:', error);
      }
    }

    this.reminders = this.reminders.filter(reminder => reminder.appointmentId !== appointmentId);
    await this.saveData();
  }

  // Smart Features
  async getSmartSuggestions(): Promise<{
    nextCheckup: string;
    medicationReview: string;
    labWork: string;
    specialistVisit: string;
  }> {
    const now = new Date();
    const lastCheckup = this.appointments
      .filter(appt => appt.type === 'checkup' && appt.status === 'completed')
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

    const lastMedicationReview = this.appointments
      .filter(appt => appt.type === 'doctor' && appt.status === 'completed')
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

    const lastLabWork = this.appointments
      .filter(appt => appt.type === 'lab' && appt.status === 'completed')
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

    const lastSpecialistVisit = this.appointments
      .filter(appt => appt.type === 'specialist' && appt.status === 'completed')
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

    // Calculate suggested dates (6 months for checkup, 3 months for others)
    const nextCheckup = lastCheckup ? 
      new Date(new Date(lastCheckup.startDate).getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() :
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const medicationReview = lastMedicationReview ?
      new Date(new Date(lastMedicationReview.startDate).getTime() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString() :
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const labWork = lastLabWork ?
      new Date(new Date(lastLabWork.startDate).getTime() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString() :
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const specialistVisit = lastSpecialistVisit ?
      new Date(new Date(lastSpecialistVisit.startDate).getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() :
      new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    return {
      nextCheckup,
      medicationReview,
      labWork,
      specialistVisit
    };
  }

  // Utility methods
  async markAppointmentCompleted(id: string): Promise<Appointment | null> {
    return this.updateAppointment(id, { status: 'completed' });
  }

  async markAppointmentCancelled(id: string): Promise<Appointment | null> {
    return this.updateAppointment(id, { status: 'cancelled' });
  }

  // Getter methods
  getAppointmentsCount(): number {
    return this.appointments.length;
  }

  getUpcomingAppointmentsCount(): number {
    const now = new Date();
    return this.appointments.filter(appt => 
      appt.status === 'scheduled' && new Date(appt.startDate) > now
    ).length;
  }

  getDoctorContactsCount(): number {
    return this.doctorContacts.length;
  }

  isCalendarPermissionGranted(): boolean {
    return this.calendarPermissionGranted;
  }
}

export default AppointmentService;
