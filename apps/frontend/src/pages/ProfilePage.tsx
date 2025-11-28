import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { User, Mail, Eye, EyeOff } from 'lucide-react';
import { getMyUser } from '../api/queries/getMyUser.ts';
import { User as UserType } from '../api/types/user.ts';
import { toast } from 'sonner';
import { getMyStats } from '../api/queries/getMyStats.ts';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '../components/ui/Dialog.tsx';
import { deleteUser } from '../api/queries/deleteUser.ts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../components/ui/Input.tsx';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/Form.tsx';
import { changePassword } from '../api/queries/changePassword.ts';
import { useSEO } from '../hooks/useSEO.ts';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();

  const changePasswordSchema = z
    .object({
      oldPassword: z.string().min(1, t('validation.currentPasswordRequired')),
      newPassword: z
        .string()
        .min(8, t('validation.passwordMinLength'))
        .max(64, t('validation.passwordMaxLength'))
        .regex(/[a-z]/, t('validation.passwordLowercase'))
        .regex(/[A-Z]/, t('validation.passwordUppercase'))
        .regex(/\d/, t('validation.passwordDigit'))
        .regex(/[!@#$%^&*(),.?":{}|<>]/, t('validation.passwordSpecial')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    });

  useSEO('profile');

  const { userData, clearUserData } = useContext(AuthContext);
  const [userDetails, setUserDetails] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ratingsCount, setRatingsCount] = useState<number>(0);
  const [wantToWatchCount, setWantToWatchCount] = useState<number>(0);
  const [watchRoomsCount, setWatchRoomsCount] = useState<number>(0);
  const [recommendationCount, setRecommendationCount] = useState<number>(0);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    mode: 'onTouched',
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const [user, stats] = await Promise.all([getMyUser(), getMyStats()]);
        setUserDetails(user);
        setRatingsCount(stats.ratingsCount);
        setWantToWatchCount(stats.wantToWatchCount);
        setWatchRoomsCount(stats.watchRoomsCount);
        setRecommendationCount(stats.recommendationCount);
      } catch {
        toast.error(t('profile.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadUserDetails();
  }, []);

  const handleDeleteAccount = async () => {
    if (!user) {
      return;
    }

    try {
      await deleteUser();
      toast.success(t('profile.deleteSuccess'));
      await clearUserData();
      navigate('/');
    } catch {
      toast.error(t('profile.deleteError'));
    }
  };

  const handleChangePassword = async (values: z.infer<typeof changePasswordSchema>) => {
    try {
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      toast.success(t('profile.passwordSuccess'));
      setIsChangePasswordDialogOpen(false);
    } catch {
      toast.error(t('profile.passwordError'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const user = userDetails || userData;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('profile.loadError')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('profile.yourProfile')}</h1>
            <p className="text-muted-foreground mt-2">{t('profile.subtitle')}</p>
          </div>

          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl">{user.name}</h2>
                  <p className="text-muted-foreground">
                    {t('profile.memberSince', { date: new Date(user.createdAt).toLocaleDateString(i18n.language) })}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t('profile.email')}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.activityTitle')}</CardTitle>
              <CardDescription>{t('profile.activitySubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{ratingsCount}</div>
                  <p className="text-sm text-muted-foreground">{t('profile.ratedShows')}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{wantToWatchCount}</div>
                  <p className="text-sm text-muted-foreground">{t('profile.wantToWatch')}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{watchRoomsCount}</div>
                  <p className="text-sm text-muted-foreground">{t('profile.watchRooms')}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{recommendationCount}</div>
                  <p className="text-sm text-muted-foreground">{t('profile.recommendations')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.securityTitle')}</CardTitle>
              <CardDescription>{t('profile.securitySubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Dialog
                  open={isChangePasswordDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      form.reset();
                    }
                    setIsChangePasswordDialogOpen(open);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1"
                    >
                      {t('profile.changePasswordButton')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('profile.changePasswordTitle')}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleChangePassword)}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="oldPassword"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>{t('profile.currentPassword')}</FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input
                                    type={showOldPassword ? 'text' : 'password'}
                                    aria-invalid={!!fieldState.error}
                                    {...field}
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                                  onClick={() => setShowOldPassword(!showOldPassword)}
                                  tabIndex={-1}
                                >
                                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                              <FormMessage className="text-destructive" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="newPassword"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>{t('profile.newPassword')}</FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input
                                    type={showNewPassword ? 'text' : 'password'}
                                    aria-invalid={!!fieldState.error}
                                    {...field}
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  tabIndex={-1}
                                >
                                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                              <FormMessage className="text-destructive" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>{t('profile.confirmPassword')}</FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    aria-invalid={!!fieldState.error}
                                    {...field}
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  tabIndex={-1}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                              <FormMessage className="text-destructive" />
                            </FormItem>
                          )}
                        />

                        {/* Password requirements */}
                        <div className="bg-muted/50 rounded-md p-4 space-y-2">
                          <p className="text-xs font-medium text-foreground">{t('profile.passwordRequirements')}</p>
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            <li>{t('profile.passwordReq1')}</li>
                            <li>{t('profile.passwordReq2')}</li>
                            <li>{t('profile.passwordReq3')}</li>
                            <li>{t('profile.passwordReq4')}</li>
                          </ul>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button
                              type="button"
                              variant="outline"
                            >
                              {t('common.cancel')}
                            </Button>
                          </DialogClose>
                          <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                          >
                            {form.formState.isSubmitting ? t('profile.changing') : t('profile.changePasswordButton')}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  className="flex-1"
                >
                  {t('profile.downloadData')}
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1"
                    >
                      {t('profile.deleteAccount')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('profile.deleteConfirmTitle')}</DialogTitle>
                      <DialogDescription>{t('profile.deleteConfirmMessage')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">{t('common.cancel')}</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                      >
                        {t('common.delete')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <hr className="border-border" />
              <div className="text-sm text-muted-foreground">
                <p>
                  {t('profile.needHelp')}{' '}
                  <a
                    href="mailto:support@show-sync.com"
                    className="text-primary hover:underline"
                  >
                    {t('profile.contactSupport')}
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
