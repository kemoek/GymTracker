'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MuscleGroup } from '@/lib/validations';

export type Locale = 'tr' | 'en';

export const translations = {
  tr: {
    nav: {
      home: 'Ana Sayfa',
      routine: 'Program',
      calendar: 'Takvim',
      statistics: 'İstatistikler',
      friends: 'Arkadaşlar',
      profile: 'Profil',
      signOut: 'Çıkış Yap',
    },
    auth: {
      welcomeBack: 'Tekrar Hoş Geldin',
      signInSubtitle: 'GymTracker hesabına giriş yap',
      signUpTitle: 'Hesap Oluştur',
      signUpSubtitle: 'Antrenmanlarını arkadaşlarınla takip et',
      username: 'Kullanıcı Adı',
      email: 'E-posta',
      usernameOrEmail: 'Kullanıcı Adı veya E-posta',
      usernameOrEmailPlaceholder: 'Kullanıcı Adı / örnek@email.com',
      password: 'Şifre',
      confirmPassword: 'Şifreyi Onayla',
      signInBtn: 'Giriş Yap',
      signUpBtn: 'Kayıt Ol',
      signingIn: 'Giriş yapılıyor...',
      signingUp: 'Hesap oluşturuluyor...',
      noAccount: 'Hesabın yok mu?',
      hasAccount: 'Zaten hesabın var mı?',
      invalidCredentials: 'Geçersiz e-posta veya şifre',
      unexpectedError: 'Beklenmeyen bir hata oluştu',
    },
    dashboard: {
      title: 'Panel',
      welcome: 'Hoş geldin',
      addWorkout: 'Antrenman Ekle',
      weeklyGoal: 'Haftalık Hedef',
      goalSuffix: 'antrenman',
      thisWeek: 'Bu Hafta',
      thisMonth: 'Bu Ay',
      streak: 'Seri',
      days: 'gün',
      total: 'Toplam',
      workouts: 'antrenman',
      recentWorkouts: 'Son Antrenmanların',
      friendActivity: 'Arkadaş Aktiviteleri',
      noWorkouts: 'Henüz antrenman kaydı yok. İlk antrenmanını ekle!',
      noActivity: 'Henüz arkadaş aktivitesi yok. Yeni arkadaşlar ekle!',
      completedWorkout: 'bir antrenman tamamladı',
      today: 'Bugün',
      yesterday: 'Dün',
    },
    calendar: {
      title: 'Takvim',
      addWorkout: 'Antrenman Ekle',
      today: 'Bugün',
      daysOfWeek: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
      noWorkoutsOnDay: 'Bu günde kayıtlı antrenman yok.',
      addBtn: 'Ekle',
      editBtn: 'Düzenle',
      deleteBtn: 'Sil',
      confirmDelete: 'Bu antrenmanı silmek istediğinizden emin misiniz?',
      loading: 'Yükleniyor...',
    },
    statistics: {
      title: 'İstatistikler',
      totalWorkouts: 'Toplam Antrenman',
      thisWeek: 'Bu Hafta',
      thisMonth: 'Bu Ay',
      avgPerWeek: 'Haftalık Ort.',
      currentStreak: 'Mevcut Seri',
      longestStreak: 'En Uzun Seri',
      last7Days: 'Son 7 Gün',
      last30Days: 'Son 30 Gün',
      weeklyChartTitle: 'Haftalık Antrenmanlar',
      monthlyChartTitle: 'Aylık Antrenmanlar',
      muscleDistributionTitle: 'Kas Grubu Dağılımı',
      activityHeatmapTitle: 'Aktivite Isı Haritası',
      less: 'Az',
      more: 'Çok',
      loading: 'İstatistikler yükleniyor...',
      noStats: 'Henüz gösterilecek istatistik verisi yok.',
      workoutsCount: 'antrenman',
    },
    friends: {
      title: 'Arkadaşlar',
      tabs: {
        friends: 'Arkadaşlar',
        leaderboard: 'Liderlik Tablosu',
        requests: 'İstekler',
        compare: 'Karşılaştır',
        add: 'Ekle',
      },
      yourFriends: 'Arkadaşların',
      noFriends: 'Henüz arkadaşın yok. Kullanıcı arayarak arkadaş ekleyebilirsin!',
      workoutsThisWeek: 'bu hafta',
      lastPrefix: 'Son',
      pendingRequests: 'Bekleyen İstekler',
      noRequests: 'Bekleyen arkadaşlık isteği yok.',
      wantsToBeFriend: 'seninle arkadaş olmak istiyor',
      accept: 'Kabul Et',
      reject: 'Reddet',
      weeklyComparison: 'Haftalık Karşılaştırma',
      noComparison: 'Karşılaştırma görmek için arkadaş ekle.',
      thisWeek: 'bu hafta',
      thisMonth: 'bu ay',
      addFriend: 'Arkadaş Ekle',
      searchPlaceholder: 'Kullanıcı adına göre ara...',
      noUsersFound: 'kullanıcısı bulunamadı',
      requestSent: 'Arkadaşlık isteği gönderildi:',
      removeConfirm: 'isimli kullanıcıyı arkadaşlıktan çıkarmak istediğine emin misin?',
      loading: 'Yükleniyor...',
    },
    profile: {
      title: 'Profil',
      joined: 'Katıldı',
      workouts: 'antrenman',
      editProfile: 'Profili Düzenle',
      username: 'Kullanıcı Adı',
      saveChanges: 'Değişiklikleri Kaydet',
      saving: 'Kaydediliyor...',
      profileUpdated: 'Profil başarıyla güncellendi',
      weeklyGoal: 'Haftalık Hedef',
      goalDescription: 'Haftalık hedef antrenman sayınızı belirleyin (1-7)',
      workoutsPerWeek: 'antrenman / hafta',
      update: 'Güncelle',
      changePassword: 'Şifre Değiştir',
      currentPassword: 'Mevcut Şifre',
      newPassword: 'Yeni Şifre',
      confirmNewPassword: 'Yeni Şifreyi Onayla',
      passwordChanged: 'Şifre başarıyla değiştirildi',
      signOut: 'Çıkış Yap',
      language: 'Dil Seçeneği',
      languageDesc: 'Uygulama arayüz dilini değiştirin',
    },
    workoutDialog: {
      addTitle: 'Antrenman Ekle',
      editTitle: 'Antrenmanı Düzenle',
      addDesc: 'Yeni bir antrenman seansı kaydedin.',
      editDesc: 'Antrenman detaylarınızı güncelleyin.',
      date: 'Tarih',
      muscleGroups: 'Kas Grupları',
      note: 'Not (isteğe bağlı)',
      notePlaceholder: 'Antrenmanın nasıldı? Neler yaptın?',
      cancel: 'İptal',
      save: 'Antrenmanı Kaydet',
      update: 'Güncelle',
      saving: 'Kaydediliyor...',
    },
    friendProfile: {
      back: 'Geri Dön',
      friendBadge: 'Arkadaşın',
      pendingBadge: 'İstek Bekliyor',
      addFriend: 'Arkadaş Ekle',
      weeklyGoalTarget: 'Haftalık Hedef:',
      workoutsPerWeek: 'antrenman / hafta',
      whatWorkedOut: 'Neler Çalıştı? (Kas Grubu Dağılımı)',
      workoutHistory: 'Son Antrenman Geçmişi',
      noWorkoutsRecorded: 'Kayıtlı antrenman bulunmuyor.',
      noMuscleData: 'Henüz kas grubu verisi yok.',
      notFound: 'Kullanıcı bulunamadı',
      userNotFoundDesc: 'Aradığınız profil mevcut değil veya silinmiş olabilir.',
    },
    routine: {
      title: 'Haftalık Programım',
      subtitle: 'Haftanın her günü ne çalışacağınızı önceden planlayın',
      todayRoutine: "Bugünün Programı",
      restDay: 'Dinlenme Günü',
      restDayDesc: 'Bugün kasların toparlanma ve dinlenme günü. İyi dinlenmeler! 🛋️',
      workoutPlanned: 'Planlanan Antrenman',
      logTodayBtn: 'Bugünkü Antrenmanı Başlat',
      alreadyLoggedToday: 'Harika! Bugünün antrenmanını tamamladın! 💪',
      noRoutineSet: 'Henüz haftalık antrenman programı belirlemedin.',
      createRoutineBtn: 'Programını Oluştur',
      presetTemplates: 'Hazır Şablonlar',
      applyPreset: 'Şablonu Uygula',
      appliedSuccess: 'Hazır şablon uygulandı',
      savedSuccess: 'Haftalık program başarıyla kaydedildi',
      editDay: 'Günü Düzenle',
      isRest: 'Dinlenme Günü',
      dayTitle: 'Antrenman Adı',
      dayTitlePlaceholder: 'örn: Push (İtiş), Göğüs & Biceps',
      selectMuscles: 'Çalışılacak Kas Grupları',
      dayNotes: 'Notlar (isteğe bağlı)',
      dayNotesPlaceholder: 'Örn: Isınmayı unutma, kardiyo ekle',
      saveRoutine: 'Programı Kaydet',
      saving: 'Kaydediliyor...',
      daysLong: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
      today: 'Bugün',
    },
    recommendation: {
      title: 'Akıllı Antrenman Önerisi',
      subtitle: 'Son 7 günlük antrenman geçmişine göre analiz edildi',
      coachTip: 'Koç Analizi & Gerekçe',
      restedReady: 'Hedeflenen Kaslar',
      yesterdayTrained: 'Dün Çalışıldı (Dinlendiriliyor)',
      startRecommendedBtn: 'Önerilen Antrenmanı Başlat',
      restDayRecommended: 'Bugün Vücudunu Dinlendir',
      badge: 'Akıllı Öneri',
    },
    muscleGroups: {
      CHEST: 'Göğüs',
      BACK: 'Sırt',
      SHOULDERS: 'Omuz',
      BICEPS: 'Biceps',
      TRICEPS: 'Triceps',
      LEGS: 'Bacak',
      ABS: 'Karın / Core',
      CARDIO: 'Kardiyo',
      OTHER: 'Diğer',
    } as Record<MuscleGroup, string>,
  },
  en: {
    nav: {
      home: 'Home',
      routine: 'Routine',
      calendar: 'Calendar',
      statistics: 'Statistics',
      friends: 'Friends',
      profile: 'Profile',
      signOut: 'Sign Out',
    },
    auth: {
      welcomeBack: 'Welcome back',
      signInSubtitle: 'Sign in to your GymTracker account',
      signUpTitle: 'Create an account',
      signUpSubtitle: 'Start tracking your gym attendance',
      username: 'Username',
      email: 'Email',
      usernameOrEmail: 'Username or Email',
      usernameOrEmailPlaceholder: 'Username or you@example.com',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      signInBtn: 'Sign In',
      signUpBtn: 'Create Account',
      signingIn: 'Signing in...',
      signingUp: 'Creating account...',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      invalidCredentials: 'Invalid email or password',
      unexpectedError: 'An unexpected error occurred',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      addWorkout: 'Add Workout',
      weeklyGoal: 'Weekly Goal',
      goalSuffix: 'workouts',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      streak: 'Streak',
      days: 'days',
      total: 'Total',
      workouts: 'workouts',
      recentWorkouts: 'Recent Workouts',
      friendActivity: 'Friend Activity',
      noWorkouts: 'No workouts yet. Add your first workout!',
      noActivity: 'No friend activity yet. Add some friends!',
      completedWorkout: 'completed a workout',
      today: 'Today',
      yesterday: 'Yesterday',
    },
    calendar: {
      title: 'Calendar',
      addWorkout: 'Add Workout',
      today: 'Today',
      daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      noWorkoutsOnDay: 'No workouts on this day.',
      addBtn: 'Add',
      editBtn: 'Edit',
      deleteBtn: 'Delete',
      confirmDelete: 'Are you sure you want to delete this workout?',
      loading: 'Loading...',
    },
    statistics: {
      title: 'Statistics',
      totalWorkouts: 'Total Workouts',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      avgPerWeek: 'Avg / Week',
      currentStreak: 'Current Streak',
      longestStreak: 'Longest Streak',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      weeklyChartTitle: 'Weekly Workouts',
      monthlyChartTitle: 'Monthly Workouts',
      muscleDistributionTitle: 'Muscle Group Distribution',
      activityHeatmapTitle: 'Activity Heatmap',
      less: 'Less',
      more: 'More',
      loading: 'Loading statistics...',
      noStats: 'No statistics available yet.',
      workoutsCount: 'workouts',
    },
    friends: {
      title: 'Friends',
      tabs: {
        friends: 'Friends',
        leaderboard: 'Leaderboard',
        requests: 'Requests',
        compare: 'Compare',
        add: 'Add',
      },
      yourFriends: 'Your Friends',
      noFriends: 'No friends yet. Search for users to add friends!',
      workoutsThisWeek: 'this week',
      lastPrefix: 'Last',
      pendingRequests: 'Pending Requests',
      noRequests: 'No pending friend requests.',
      wantsToBeFriend: 'wants to be your friend',
      accept: 'Accept',
      reject: 'Reject',
      weeklyComparison: 'Weekly Comparison',
      noComparison: 'Add friends to see comparisons.',
      thisWeek: 'this week',
      thisMonth: 'this month',
      addFriend: 'Add Friend',
      searchPlaceholder: 'Search users by username...',
      noUsersFound: 'No users found matching',
      requestSent: 'Friend request sent to',
      removeConfirm: 'Remove from friends?',
      loading: 'Loading...',
    },
    profile: {
      title: 'Profile',
      joined: 'Joined',
      workouts: 'workouts',
      editProfile: 'Edit Profile',
      username: 'Username',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      profileUpdated: 'Profile updated successfully',
      weeklyGoal: 'Weekly Goal',
      goalDescription: 'Set your weekly workout target (1-7)',
      workoutsPerWeek: 'workouts per week',
      update: 'Update',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      passwordChanged: 'Password changed successfully',
      signOut: 'Sign Out',
      language: 'Language',
      languageDesc: 'Change application display language',
    },
    workoutDialog: {
      addTitle: 'Add Workout',
      editTitle: 'Edit Workout',
      addDesc: 'Record a new workout session.',
      editDesc: 'Update your workout details.',
      date: 'Date',
      muscleGroups: 'Muscle Groups',
      note: 'Note (optional)',
      notePlaceholder: 'How was your workout?',
      cancel: 'Cancel',
      save: 'Save Workout',
      update: 'Update',
      saving: 'Saving...',
    },
    friendProfile: {
      back: 'Go Back',
      friendBadge: 'Friend',
      pendingBadge: 'Request Pending',
      addFriend: 'Add Friend',
      weeklyGoalTarget: 'Weekly Goal:',
      workoutsPerWeek: 'workouts / week',
      whatWorkedOut: 'What Did They Train? (Muscle Breakdown)',
      workoutHistory: 'Recent Workout History',
      noWorkoutsRecorded: 'No workouts recorded yet.',
      noMuscleData: 'No muscle group data yet.',
      notFound: 'User not found',
      userNotFoundDesc: 'The user profile you are looking for does not exist.',
    },
    routine: {
      title: 'My Weekly Routine',
      subtitle: 'Plan what muscle groups to train each day',
      todayRoutine: "Today's Routine",
      restDay: 'Rest Day',
      restDayDesc: 'Today is for rest and muscle recovery. Enjoy your rest! 🛋️',
      workoutPlanned: 'Planned Workout',
      logTodayBtn: "Start Today's Workout",
      alreadyLoggedToday: "Awesome! You already completed today's workout! 💪",
      noRoutineSet: 'You have not set up a weekly routine yet.',
      createRoutineBtn: 'Create Your Routine',
      presetTemplates: 'Ready-Made Templates',
      applyPreset: 'Apply Template',
      appliedSuccess: 'Preset applied successfully',
      savedSuccess: 'Routine saved successfully',
      editDay: 'Edit Day',
      isRest: 'Rest Day',
      dayTitle: 'Workout Title',
      dayTitlePlaceholder: 'e.g. Push, Chest & Biceps',
      selectMuscles: 'Muscle Groups to Train',
      dayNotes: 'Notes (optional)',
      dayNotesPlaceholder: 'e.g. Don’t forget warmup, add cardio',
      saveRoutine: 'Save Routine',
      saving: 'Saving...',
      daysLong: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      today: 'Today',
    },
    recommendation: {
      title: 'Smart Workout Suggestion',
      subtitle: 'Analyzed based on your last 7 days of workout history',
      coachTip: 'Coach Analysis & Reasoning',
      restedReady: 'Target Muscles',
      yesterdayTrained: 'Trained Yesterday (Resting)',
      startRecommendedBtn: 'Start Recommended Workout',
      restDayRecommended: 'Rest Your Body Today',
      badge: 'Smart Suggestion',
    },
    muscleGroups: {
      CHEST: 'Chest',
      BACK: 'Back',
      SHOULDERS: 'Shoulders',
      BICEPS: 'Biceps',
      TRICEPS: 'Triceps',
      LEGS: 'Legs',
      ABS: 'Abs / Core',
      CARDIO: 'Cardio',
      OTHER: 'Other',
    } as Record<MuscleGroup, string>,
  },
};

type Translations = typeof translations.tr;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  formatRelativeDate: (dateStr: string) => string;
  formatDate: (dateStr: string) => string;
  getMuscleGroupLabel: (group: MuscleGroup | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('tr');

  useEffect(() => {
    const saved = localStorage.getItem('gymtracker_lang') as Locale | null;
    if (saved === 'tr' || saved === 'en') {
      setLocaleState(saved);
    } else {
      // Default to user browser language if Turkish, else default to 'tr'
      const browserLang = navigator.language?.toLowerCase() || '';
      setLocaleState(browserLang.startsWith('tr') ? 'tr' : 'en');
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('gymtracker_lang', newLocale);
  };

  const t = translations[locale];

  const formatRelative = (dateStr: string): string => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    if (dateStr === today) return t.dashboard.today;
    if (dateStr === yesterday) return t.dashboard.yesterday;

    return formatDt(dateStr);
  };

  const formatDt = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMuscleGroupLabel = (group: MuscleGroup | string): string => {
    return t.muscleGroups[group as MuscleGroup] || group;
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatRelativeDate: formatRelative,
        formatDate: formatDt,
        getMuscleGroupLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
