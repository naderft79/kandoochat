"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon, Coins, TrendingUp, Zap, Shield, Wrench,
  Compass, Heart, Filter, Undo2, MessageSquare, Image, Type,
  DollarSign, Camera, Images, BookOpen, FileText, Ban, Globe,
  Trash2, BadgeCheck, Bell, Mail, BellRing, Palette, Scale,
  Info, UserPlus, Crown, Gift, Bot, Send, Tag, BarChart3, ScrollText,
} from "lucide-react";
import type { getAllSettings } from "@/lib/settings";
import FinanceSettings from "./settings/FinanceSettings";
import PackagesSettings from "./settings/PackagesSettings";
import BoostSettings from "./settings/BoostSettings";
import SecuritySettings from "./settings/SecuritySettings";
import MaintenanceSettings from "./settings/MaintenanceSettings";
import DiscoverySettings from "./settings/DiscoverySettings";
import LikeSettings from "./settings/LikeSettings";
import FilterSettings from "./settings/FilterSettings";
import RewindSettings from "./settings/RewindSettings";
import ChatSettings from "./settings/ChatSettings";
import ChatMediaSettings from "./settings/ChatMediaSettings";
import WordFilterSettings from "./settings/WordFilterSettings";
import ChatCostSettings from "./settings/ChatCostSettings";
import ProfilePhotoSettings from "./settings/ProfilePhotoSettings";
import GallerySettings from "./settings/GallerySettings";
import StorySettings from "./settings/StorySettings";
import BioSettings from "./settings/BioSettings";
import ReportBanSettings from "./settings/ReportBanSettings";
import IpLimitSettings from "./settings/IpLimitSettings";
import AutoDeleteSettings from "./settings/AutoDeleteSettings";
import IdentitySettings from "./settings/IdentitySettings";
import NotificationSettings from "./settings/NotificationSettings";
import SystemMessageSettings from "./settings/SystemMessageSettings";
import PushSettings from "./settings/PushSettings";
import BrandingSettings from "./settings/BrandingSettings";
import LegalSettings from "./settings/LegalSettings";
import AboutSettings from "./settings/AboutSettings";
import RegistrationSettings from "./settings/RegistrationSettings";
import SubscriptionSettings from "./settings/SubscriptionSettings";
import GiftSettings from "./settings/GiftSettings";
import BotSettings from "./settings/BotSettings";
import AutoMessageSettings from "./settings/AutoMessageSettings";
import CouponSettings from "./settings/CouponSettings";
import AnalyticsSettings from "./settings/AnalyticsSettings";
import LogSettings from "./settings/LogSettings";

type AllSettings = Awaited<ReturnType<typeof getAllSettings>>;
type Props = AllSettings;

type TabKey =
  | "finance" | "packages" | "boost" | "security" | "maintenance"
  | "discovery" | "like" | "filter" | "rewind" | "chat"
  | "chatMedia" | "wordFilter" | "chatCost" | "profilePhoto" | "gallery"
  | "story" | "bio" | "reportBan" | "ipLimit" | "autoDelete"
  | "identity" | "notification" | "systemMessage" | "push" | "branding"
  | "legal" | "about" | "registration" | "subscription" | "gift"
  | "bot" | "autoMessage" | "coupon" | "analytics" | "log";

export default function SettingsClient(props: Props) {
  const [tab, setTab] = useState<TabKey>("finance");
  const p = props as AllSettings;

  const tabs: { key: TabKey; label: string; icon: typeof Coins }[] = [
    { key: "finance", label: "مالی و سکه", icon: Coins },
    { key: "packages", label: "بسته های خرید", icon: TrendingUp },
    { key: "boost", label: "بوست و پاداش", icon: Zap },
    { key: "security", label: "امنیت و ثبت نام", icon: Shield },
    { key: "maintenance", label: "حالت تعمیر", icon: Wrench },
    { key: "discovery", label: "کشف و جستجو", icon: Compass },
    { key: "like", label: "لایک و سوپر لایک", icon: Heart },
    { key: "filter", label: "فیلترهای اجباری", icon: Filter },
    { key: "rewind", label: "Rewind", icon: Undo2 },
    { key: "chat", label: "چت و پیام", icon: MessageSquare },
    { key: "chatMedia", label: "مدیا در چت", icon: Image },
    { key: "wordFilter", label: "فیلتر کلمات", icon: Type },
    { key: "chatCost", label: "هزینه باز کردن چت", icon: DollarSign },
    { key: "profilePhoto", label: "عکس پروفایل", icon: Camera },
    { key: "gallery", label: "عکس گالری", icon: Images },
    { key: "story", label: "استوری", icon: BookOpen },
    { key: "bio", label: "بیوگرافی", icon: FileText },
    { key: "reportBan", label: "گزارش و بن", icon: Ban },
    { key: "ipLimit", label: "محدودیت IP", icon: Globe },
    { key: "autoDelete", label: "حذف خودکار", icon: Trash2 },
    { key: "identity", label: "تایید هویت", icon: BadgeCheck },
    { key: "notification", label: "اعلان ها", icon: Bell },
    { key: "systemMessage", label: "پیام سیستمی", icon: Mail },
    { key: "push", label: "پوش نوتیفیکیشن", icon: BellRing },
    { key: "branding", label: "ظاهر و برند", icon: Palette },
    { key: "legal", label: "قوانین و مقررات", icon: Scale },
    { key: "about", label: "درباره ما", icon: Info },
    { key: "registration", label: "ثبت نام و ورود", icon: UserPlus },
    { key: "subscription", label: "اشتراک و VIP", icon: Crown },
    { key: "gift", label: "هدیه و انتقال سکه", icon: Gift },
    { key: "bot", label: "ربات های تشویقی", icon: Bot },
    { key: "autoMessage", label: "پیام های خودکار", icon: Send },
    { key: "coupon", label: "بازاریابی و تخفیف", icon: Tag },
    { key: "analytics", label: "آمار و گزارش", icon: BarChart3 },
    { key: "log", label: "لاگ و ممیزی", icon: ScrollText },
  ];

  return (
    <div className="space-y-4">
      {/* هدر */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-[#d4af37]" />
              تنظیمات
            </h1>
            <p className="text-[#888] mt-1 text-xs">مدیریت تنظیمات سایت</p>
          </div>
        </div>
      </div>

      {/* تب ها */}
      <div className="flex flex-wrap gap-2 pb-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                active ? "lux-btn-gold border-transparent" : "lux-card text-[#888] hover:text-[#d4af37]"
              }`}
            >
              <t.icon className="w-4 h-4" strokeWidth={2} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* محتوای تب */}
      {tab === "finance" && (
        <FinanceSettings
          coinValue={p.coinValue} subscriptionPrice={p.subscriptionPrice}
          minWithdrawCoins={p.minWithdrawCoins}
          maxCoinsPerPurchase={p.maxCoinsPerPurchase} minCoinsForGift={p.minCoinsForGift}
          withdrawCommissionPercent={p.withdrawCommissionPercent}
        />
      )}
      {tab === "packages" && <PackagesSettings coinPackages={p.coinPackages} />}
      {tab === "boost" && (
        <BoostSettings
          boostCostCoins={p.boostCostCoins} boostDurationMinutes={p.boostDurationMinutes}
          referralRewardCoins={p.referralRewardCoins} streakRewardCoins={p.streakRewardCoins}
          referralMilestoneCount={p.referralMilestoneCount} referralMilestoneCoins={p.referralMilestoneCoins}
          referralDailyLimit={p.referralDailyLimit} referralMaxRewarded={p.referralMaxRewarded}
        />
      )}
      {tab === "security" && (
        <SecuritySettings
          specialRegisterSlug={p.specialRegisterSlug} otpEnabled={p.otpEnabled}
          buyCoinsEnabled={p.buyCoinsEnabled} withdrawCoinsEnabled={p.withdrawCoinsEnabled}
        />
      )}
      {tab === "maintenance" && (
        <MaintenanceSettings maintenanceMode={p.maintenanceMode} maintenanceMessage={p.maintenanceMessage} />
      )}
      {tab === "discovery" && (
        <DiscoverySettings
          discoveryDefaultRadius={p.discoveryDefaultRadius} discoveryMinAgeGap={p.discoveryMinAgeGap}
          discoveryMaxAgeGap={p.discoveryMaxAgeGap} discoveryOnlineFirst={p.discoveryOnlineFirst}
          discoveryResultsPerPage={p.discoveryResultsPerPage} discoveryShowNoPhoto={p.discoveryShowNoPhoto}
          discoveryShowUnverified={p.discoveryShowUnverified} discoveryMaxRadius={p.discoveryMaxRadius}
          discoveryShowEmptyBio={p.discoveryShowEmptyBio} discoveryVipPriority={p.discoveryVipPriority}
          discoveryDistanceUnit={p.discoveryDistanceUnit} discoveryShowExactAge={p.discoveryShowExactAge}
        />
      )}
      {tab === "like" && (
        <LikeSettings
          dailyLikeLimit={p.dailyLikeLimit} superLikeDailyLimit={p.superLikeDailyLimit}
          superLikeCostCoins={p.superLikeCostCoins} likeCooldownSeconds={p.likeCooldownSeconds}
          vipDailyLikeLimit={p.vipDailyLikeLimit} vipSuperLikeDailyLimit={p.vipSuperLikeDailyLimit}
          likeExtraCostCoins={p.likeExtraCostCoins} showLikersFree={p.showLikersFree}
          likeRequireVerified={p.likeRequireVerified} likeHourlyLimit={p.likeHourlyLimit}
          showReceivedLikes={p.showReceivedLikes} likeAfterReject={p.likeAfterReject}
        />
      )}
      {tab === "filter" && (
        <FilterSettings
          requireProfilePhoto={p.requireProfilePhoto} requireIdentityVerification={p.requireIdentityVerification}
          minProfileCompletion={p.minProfileCompletion} requireBio={p.requireBio}
          requireInterests={p.requireInterests} minProfilePhotos={p.minProfilePhotos}
          hideBannedUsers={p.hideBannedUsers} hideInactiveDays={p.hideInactiveDays}
          filterOutOfAgeRange={p.filterOutOfAgeRange} hideNoLocation={p.hideNoLocation}
          requirePhoneVerified={p.requirePhoneVerified} minBioLengthForDisplay={p.minBioLengthForDisplay}
        />
      )}
      {tab === "rewind" && (
        <RewindSettings
          rewindCostCoins={p.rewindCostCoins} rewindFreeDaily={p.rewindFreeDaily}
          vipRewindDaily={p.vipRewindDaily} rewindTimeWindowMinutes={p.rewindTimeWindowMinutes}
          rewindExtraCostCoins={p.rewindExtraCostCoins} rewindDisabledFree={p.rewindDisabledFree}
          showRewindRemaining={p.showRewindRemaining} rewindRejectOnly={p.rewindRejectOnly}
          rewindHourlyLimit={p.rewindHourlyLimit} showLastRewindTime={p.showLastRewindTime}
        />
      )}
      {tab === "chat" && (
        <ChatSettings
          freeDailyMessageLimit={p.freeDailyMessageLimit} chatStartCostCoins={p.chatStartCostCoins}
          maxMessageLength={p.maxMessageLength} vipDailyMessageLimit={p.vipDailyMessageLimit}
          freeMessageCostCoins={p.freeMessageCostCoins} chatRequireVerified={p.chatRequireVerified}
          chatRequireMatch={p.chatRequireMatch} maxConcurrentChats={p.maxConcurrentChats}
          showTypingStatus={p.showTypingStatus} showReadReceipt={p.showReadReceipt}
          allowDeleteMessage={p.allowDeleteMessage} messageRateLimitPerMin={p.messageRateLimitPerMin}
        />
      )}
      {tab === "chatMedia" && (
        <ChatMediaSettings
          chatAllowPhoto={p.chatAllowPhoto} chatAllowVoice={p.chatAllowVoice}
          chatAllowVideo={p.chatAllowVideo} chatMaxFileSizeMb={p.chatMaxFileSizeMb}
          chatPhotoQuality={p.chatPhotoQuality} chatMaxVoiceSeconds={p.chatMaxVoiceSeconds}
          chatMaxVideoSeconds={p.chatMaxVideoSeconds} chatAllowFile={p.chatAllowFile}
          chatPhotoCostCoins={p.chatPhotoCostCoins} chatVoiceCostCoins={p.chatVoiceCostCoins}
          chatMediaFreeDisabled={p.chatMediaFreeDisabled} chatPhotoPreview={p.chatPhotoPreview}
        />
      )}
      {tab === "wordFilter" && (
        <WordFilterSettings
          bannedWords={p.bannedWords} bannedWordReplacement={p.bannedWordReplacement}
          blockPhoneInMessage={p.blockPhoneInMessage} blockLinkInMessage={p.blockLinkInMessage}
          blockEmailInMessage={p.blockEmailInMessage} bannedWordWarnCount={p.bannedWordWarnCount}
          bannedWordAutoBanCount={p.bannedWordAutoBanCount} filterBioWords={p.filterBioWords}
          filterUsernameWords={p.filterUsernameWords} filterStoryWords={p.filterStoryWords}
          softWarnWords={p.softWarnWords}
        />
      )}
      {tab === "chatCost" && (
        <ChatCostSettings
          chatOpenCostMale={p.chatOpenCostMale} chatOpenFreeFemale={p.chatOpenFreeFemale}
          chatOpenVipDiscount={p.chatOpenVipDiscount} chatOpenSamePersonCost={p.chatOpenSamePersonCost}
          chatOpenRefundNoReply={p.chatOpenRefundNoReply} chatOpenRefundWaitHours={p.chatOpenRefundWaitHours}
          chatOpenVipUserCost={p.chatOpenVipUserCost} chatOpenFirstFreeDaily={p.chatOpenFirstFreeDaily}
          chatUnlimitedDailyCost={p.chatUnlimitedDailyCost} chatVideoCostCoins={p.chatVideoCostCoins}
          chatOpenShowCostBefore={p.chatOpenShowCostBefore} chatOpenRefundDisabled={p.chatOpenRefundDisabled}
        />
      )}
      {tab === "profilePhoto" && (
        <ProfilePhotoSettings
          minProfilePhotosRequired={p.minProfilePhotosRequired} maxProfilePhotos={p.maxProfilePhotos}
          requireFacePhoto={p.requireFacePhoto} autoApproveProfilePhoto={p.autoApproveProfilePhoto}
          profilePhotoMaxSizeMb={p.profilePhotoMaxSizeMb} profilePhotoMinPixels={p.profilePhotoMinPixels}
          allowPhotoFilter={p.allowPhotoFilter} aiFaceDetection={p.aiFaceDetection}
          removeBlurryFace={p.removeBlurryFace} requireNoGlasses={p.requireNoGlasses}
          requireRealPhoto={p.requireRealPhoto} showVerifiedPhotoBadge={p.showVerifiedPhotoBadge}
        />
      )}
      {tab === "gallery" && (
        <GallerySettings
          maxGalleryPhotos={p.maxGalleryPhotos} galleryPhotoMaxSizeMb={p.galleryPhotoMaxSizeMb}
          galleryAllowVideo={p.galleryAllowVideo} maxGalleryVideos={p.maxGalleryVideos}
          galleryVideoMaxSizeMb={p.galleryVideoMaxSizeMb} galleryVideoMaxSeconds={p.galleryVideoMaxSeconds}
          galleryFreeUpload={p.galleryFreeUpload} vipMaxGalleryPhotos={p.vipMaxGalleryPhotos}
          autoApproveGallery={p.autoApproveGallery} galleryAutoCompress={p.galleryAutoCompress}
          galleryShowUploadDate={p.galleryShowUploadDate}
        />
      )}
      {tab === "story" && (
        <StorySettings
          storyDurationHours={p.storyDurationHours} storyMaxDaily={p.storyMaxDaily}
          autoApproveStory={p.autoApproveStory} storyMaxSizeMb={p.storyMaxSizeMb}
          storyAllowVideo={p.storyAllowVideo} storyVideoMaxSeconds={p.storyVideoMaxSeconds}
          storyAllowText={p.storyAllowText} storyMaxTextLength={p.storyMaxTextLength}
          storyVisibleTo={p.storyVisibleTo} storyAllowReply={p.storyAllowReply}
          storyShowViewers={p.storyShowViewers} storyAutoDeleteExpired={p.storyAutoDeleteExpired}
        />
      )}
      {tab === "bio" && (
        <BioSettings
          bioMaxLength={p.bioMaxLength} bioMinLength={p.bioMinLength}
          bioFilterWords={p.bioFilterWords} bioAllowEmoji={p.bioAllowEmoji}
          bioAllowLink={p.bioAllowLink} bioAllowPhone={p.bioAllowPhone}
          bioAllowInterestTags={p.bioAllowInterestTags} bioMaxInterests={p.bioMaxInterests}
          bioEditableAfterApproval={p.bioEditableAfterApproval} bioShowCompletionPercent={p.bioShowCompletionPercent}
          bioRequired={p.bioRequired} bioAllowMultiline={p.bioAllowMultiline}
        />
      )}
      {tab === "reportBan" && (
        <ReportBanSettings
          autoBanReportCount={p.autoBanReportCount} autoBanDurationHours={p.autoBanDurationHours}
          banWarningMessage={p.banWarningMessage} manualBanDefaultHours={p.manualBanDefaultHours}
          allowBanAppeal={p.allowBanAppeal} banAppealDays={p.banAppealDays}
          banIpWithUser={p.banIpWithUser} reportPriorityByCount={p.reportPriorityByCount}
          banUserMessage={p.banUserMessage} unbanUserMessage={p.unbanUserMessage}
          minLevelToReport={p.minLevelToReport}
        />
      )}
      {tab === "ipLimit" && (
        <IpLimitSettings
          preventMultiAccountIp={p.preventMultiAccountIp} maxAccountsPerIp={p.maxAccountsPerIp}
          blockedIps={p.blockedIps} whitelistedIps={p.whitelistedIps}
          blockVpn={p.blockVpn} blockTor={p.blockTor} blockProxy={p.blockProxy}
          showUserIpAdmin={p.showUserIpAdmin} loginFailWarnCount={p.loginFailWarnCount}
          loginFailBanCount={p.loginFailBanCount} ipBanDurationHours={p.ipBanDurationHours}
          adminIpOverride={p.adminIpOverride}
        />
      )}
      {tab === "autoDelete" && (
        <AutoDeleteSettings
          autoDeleteInactiveDays={p.autoDeleteInactiveDays} autoDeleteOldChatsDays={p.autoDeleteOldChatsDays}
          autoDeleteOldMessagesDays={p.autoDeleteOldMessagesDays} autoDeleteExpiredStory={p.autoDeleteExpiredStory}
          autoDeleteRemovedUserPhotos={p.autoDeleteRemovedUserPhotos} autoDeleteResolvedReportsDays={p.autoDeleteResolvedReportsDays}
          autoDeleteOldLogsDays={p.autoDeleteOldLogsDays} autoDeleteExpiredCoupons={p.autoDeleteExpiredCoupons}
          autoDeleteWarnDays={p.autoDeleteWarnDays} archiveBeforeDelete={p.archiveBeforeDelete}
          autoDeleteExpiredTokens={p.autoDeleteExpiredTokens} autoDeleteOldNotificationsDays={p.autoDeleteOldNotificationsDays}
        />
      )}
      {tab === "identity" && (
        <IdentitySettings
          requireIdentityForChat={p.requireIdentityForChat} identityValidityDays={p.identityValidityDays}
          identityRejectMessage={p.identityRejectMessage} identityApproveMessage={p.identityApproveMessage}
          identityRequiredPhotos={p.identityRequiredPhotos} requireNationalId={p.requireNationalId}
          requireSelfieFace={p.requireSelfieFace} aiAutoVerifyIdentity={p.aiAutoVerifyIdentity}
          identityMinAge={p.identityMinAge} showBlueBadge={p.showBlueBadge}
          revokeIdentityOnPhotoChange={p.revokeIdentityOnPhotoChange} vipChatWithoutIdentity={p.vipChatWithoutIdentity}
        />
      )}
      {tab === "notification" && (
        <NotificationSettings
          notifyNewLike={p.notifyNewLike} notifyNewMessage={p.notifyNewMessage}
          notifyNewMatch={p.notifyNewMatch} notifyNewStory={p.notifyNewStory}
          notifySuperLike={p.notifySuperLike} notifyGiftReceived={p.notifyGiftReceived}
          notifySubscriptionExpiry={p.notifySubscriptionExpiry} notifySystemMessage={p.notifySystemMessage}
          notifyCoinRefund={p.notifyCoinRefund} notifyIdentityResult={p.notifyIdentityResult}
          notifyBanWarning={p.notifyBanWarning} notifyDisableAll={p.notifyDisableAll}
        />
      )}
      {tab === "systemMessage" && (
        <SystemMessageSettings
          sysmsgWelcome={p.sysmsgWelcome} sysmsgNewMatch={p.sysmsgNewMatch}
          sysmsgBan={p.sysmsgBan} sysmsgIdentityApproved={p.sysmsgIdentityApproved}
          sysmsgIdentityRejected={p.sysmsgIdentityRejected} sysmsgSubscriptionExpiry={p.sysmsgSubscriptionExpiry}
          sysmsgGiftReceived={p.sysmsgGiftReceived} sysmsgReportReceived={p.sysmsgReportReceived}
          sysmsgPasswordChange={p.sysmsgPasswordChange} sysmsgNewDeviceLogin={p.sysmsgNewDeviceLogin}
          sysmsgReject={p.sysmsgReject} sysmsgReferralReward={p.sysmsgReferralReward}
        />
      )}
      {tab === "push" && (
        <PushSettings
          pushEnabled={p.pushEnabled} pushDefaultTitle={p.pushDefaultTitle}
          pushDefaultBody={p.pushDefaultBody} pushIntervalMinutes={p.pushIntervalMinutes}
          pushMaxDaily={p.pushMaxDaily} pushQuietHours={p.pushQuietHours}
          pushQuietStart={p.pushQuietStart} pushQuietEnd={p.pushQuietEnd}
          pushOnlineOnly={p.pushOnlineOnly} pushWithPhoto={p.pushWithPhoto}
          pushCustomSound={p.pushCustomSound} pushFreeDisabled={p.pushFreeDisabled}
        />
      )}
      {tab === "branding" && (
        <BrandingSettings
          siteName={p.siteName} siteLogo={p.siteLogo} sitePrimaryColor={p.sitePrimaryColor}
          siteSecondaryColor={p.siteSecondaryColor} siteSlogan={p.siteSlogan} siteFavicon={p.siteFavicon}
          siteLoginBg={p.siteLoginBg} siteOgImage={p.siteOgImage} siteFont={p.siteFont}
          siteThemeMode={p.siteThemeMode} siteNotificationColor={p.siteNotificationColor}
          siteButtonColor={p.siteButtonColor}
        />
      )}
      {tab === "legal" && (
        <LegalSettings
          legalTerms={p.legalTerms} legalPrivacy={p.legalPrivacy} legalRefund={p.legalRefund}
          legalTermsOfUse={p.legalTermsOfUse} legalCookie={p.legalCookie} legalConsent={p.legalConsent}
          legalAgeWarning={p.legalAgeWarning} legalAntiFraud={p.legalAntiFraud}
          legalChatRules={p.legalChatRules} legalPhotoRules={p.legalPhotoRules}
          legalStoryRules={p.legalStoryRules} legalPaymentRules={p.legalPaymentRules}
        />
      )}
      {tab === "about" && (
        <AboutSettings
          aboutText={p.aboutText} aboutContactInfo={p.aboutContactInfo} aboutAddress={p.aboutAddress}
          aboutPhone={p.aboutPhone} aboutEmail={p.aboutEmail} aboutSocialLinks={p.aboutSocialLinks}
          aboutSupportHours={p.aboutSupportHours} aboutTelegram={p.aboutTelegram}
          aboutWhatsapp={p.aboutWhatsapp} aboutInstagram={p.aboutInstagram}
          aboutTeam={p.aboutTeam} aboutFoundedYear={p.aboutFoundedYear}
        />
      )}
      {tab === "registration" && (
        <RegistrationSettings
          registrationClosed={p.registrationClosed} requireEmailVerification={p.requireEmailVerification}
          requirePhoneVerification={p.requirePhoneVerification} minRegisterAge={p.minRegisterAge}
          captchaEnabled={p.captchaEnabled}
          registerHourlyLimit={p.registerHourlyLimit} registerSuccessMessage={p.registerSuccessMessage}
          registerErrorMessage={p.registerErrorMessage} registerGoogleEnabled={p.registerGoogleEnabled}
        />
      )}
      {tab === "subscription" && (
        <SubscriptionSettings
          freeTrialDays={p.freeTrialDays} firstPurchaseDiscount={p.firstPurchaseDiscount}
          subscriptionExpiryWarnDays={p.subscriptionExpiryWarnDays} subscriptionExpiredMessage={p.subscriptionExpiredMessage}
          autoRenewSubscription={p.autoRenewSubscription} subscriptionRefundEnabled={p.subscriptionRefundEnabled}
          subscriptionRefundDays={p.subscriptionRefundDays} showPriceIn={p.showPriceIn}
          subscription3MonthPrice={p.subscription3MonthPrice} subscription6MonthPrice={p.subscription6MonthPrice}
          subscription12MonthPrice={p.subscription12MonthPrice} longTermDiscount={p.longTermDiscount}
        />
      )}
      {tab === "gift" && (
        <GiftSettings
          maxDailyGiftCoins={p.maxDailyGiftCoins} minTierForGift={p.minTierForGift}
          giftMessageRequired={p.giftMessageRequired} giftMessageMaxLength={p.giftMessageMaxLength}
          giftTransferFeePercent={p.giftTransferFeePercent} minTransferCoins={p.minTransferCoins}
          maxTransferCoins={p.maxTransferCoins} giftToNonMatch={p.giftToNonMatch}
          showGiftInProfile={p.showGiftInProfile} giftHistoryEnabled={p.giftHistoryEnabled}
          groupGiftEnabled={p.groupGiftEnabled} giftFreeDisabled={p.giftFreeDisabled}
        />
      )}
      {tab === "bot" && (
        <BotSettings
          botFemaleCount={p.botFemaleCount} botMaleCount={p.botMaleCount} botEnabled={p.botEnabled}
          botMessages={p.botMessages} botPhotos={p.botPhotos} botCanLike={p.botCanLike}
          botCanMessage={p.botCanMessage} botCanStory={p.botCanStory} botUserPercent={p.botUserPercent}
          botNewUsersOnly={p.botNewUsersOnly} botActiveDays={p.botActiveDays}
          botDisableAfterRealLikes={p.botDisableAfterRealLikes}
        />
      )}
      {tab === "autoMessage" && (
        <AutoMessageSettings
          automsgBirthday={p.automsgBirthday} automsgAnniversary={p.automsgAnniversary}
          automsgLongMembership={p.automsgLongMembership} automsgWelcomeRegister={p.automsgWelcomeRegister}
          automsgCompleteProfile={p.automsgCompleteProfile} automsgUploadPhoto={p.automsgUploadPhoto}
          automsgBuySubscription={p.automsgBuySubscription} automsgInactiveReturn={p.automsgInactiveReturn}
          automsgStreakReminder={p.automsgStreakReminder} automsgStreakReward={p.automsgStreakReward}
          automsgInviteFriends={p.automsgInviteFriends} automsgSurvey={p.automsgSurvey}
        />
      )}
      {tab === "coupon" && (
        <CouponSettings
          couponEnabled={p.couponEnabled} couponDefaultPercent={p.couponDefaultPercent}
          couponDefaultValidDays={p.couponDefaultValidDays} couponMaxUses={p.couponMaxUses}
          couponMaxUsesPerUser={p.couponMaxUsesPerUser} couponFirstPurchase={p.couponFirstPurchase}
          couponReturningUser={p.couponReturningUser} couponSpecialEvent={p.couponSpecialEvent}
          couponShowOnPurchase={p.couponShowOnPurchase} couponUseMessage={p.couponUseMessage}
        />
      )}
      {tab === "analytics" && (
        <AnalyticsSettings
          analyticsEnabled={p.analyticsEnabled} analyticsDailyReport={p.analyticsDailyReport}
          analyticsAdminEmail={p.analyticsAdminEmail} analyticsNewUsersDaily={p.analyticsNewUsersDaily}
          analyticsRevenueDaily={p.analyticsRevenueDaily} analyticsNewChatsDaily={p.analyticsNewChatsDaily}
          analyticsNewMatchesDaily={p.analyticsNewMatchesDaily} analyticsUserDeletions={p.analyticsUserDeletions}
          analyticsSystemErrors={p.analyticsSystemErrors} analyticsCoinUsage={p.analyticsCoinUsage}
          analyticsBotPerformance={p.analyticsBotPerformance} analyticsPageViews={p.analyticsPageViews}
        />
      )}
      {tab === "log" && (
        <LogSettings
          logLevel={p.logLevel} logRetentionDays={p.logRetentionDays}
          logAdminActions={p.logAdminActions} logUserLogin={p.logUserLogin}
          logSettingsChanges={p.logSettingsChanges} logFinancialTransactions={p.logFinancialTransactions}
          logBansReports={p.logBansReports} logApiErrors={p.logApiErrors}
          logDbChanges={p.logDbChanges} logEmailEnabled={p.logEmailEnabled}
          logToDb={p.logToDb} logLiveView={p.logLiveView}
        />
      )}
    </div>
  );
}
