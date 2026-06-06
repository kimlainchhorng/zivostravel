# Zivo Travel Backend Inventory

Generated: 2026-06-06

Source repo scanned: `/Users/kimlain/Documents/GitHub/zivosmedia`

Target repo: `/Users/kimlain/Documents/GitHub/zivostravel`

Target Supabase project: `xbllvmpomorawkcrtbcq`

## Live Travel Supabase State

- Current live migration: `zivo_travel_backend_foundation`
- Current public tables: `zivo_travel_backend_links`, `zivo_travel_service_catalog`, `zivo_travel_search_events`, `zivo_travel_partner_workflows`, `zivo_travel_sync_runs`
- Current Edge Functions: none
- Current mode: bridge/staged migration, not live booking authority

## Domain Summary

| Domain | Candidate files | Owner target | Migration note |
| --- | ---: | --- | --- |
| flight | 102 | Zivo Travel | Move after provider secrets, booking draft, checkout, ticketing, cancellation, and webhook flows are staged. |
| hotel | 162 | Zivo Travel plus partner owner consoles | Move customer booking/search to Travel; keep hotel owner operations in Software/owner console unless staff-only. |
| rental_car | 85 | Zivo Travel for customer rentals; Zivo Software for fleet owner tools | Move public rental search/checkout to Travel; keep fleet management owner tools in Software/owner console. |
| bus | 58 | Zivo Travel | Good first live workflow candidate because it can be smaller than flight/hotel provider flows. |
| checkout_payment | 244 | Zivo Admin/ZivosMedia until payment cutover is reviewed | Keep central during bridge mode; move only with Stripe secrets, webhooks, refunds, audit logs, and rollback. |
| support_admin | 12 | Zivo Admin | Move staff support/monitoring to Zivo-Admin; keep customer self-service in Travel. |

## Referenced Tables

| Object | Domains | Files | First locations |
| --- | --- | ---: | --- |
| `store_profiles` | bus, checkout_payment, flight, hotel, rental_car, support_admin | 52 | `src/pages/MyLodgingTripPage.tsx`, `src/pages/PartnerLogin.tsx`, `src/pages/ReelsFeedPage.tsx`, `src/pages/StoreMapPage.tsx`, `src/pages/StoresListPage.tsx`, plus 47 more |
| `lodge_reservations` | bus, checkout_payment, flight, hotel | 31 | `src/pages/MyLodgingTripPage.tsx`, `src/pages/admin/AdminFinanceSummaryPage.tsx`, `src/pages/admin/lodging/AdminLodgingReservationDetailPage.tsx`, `src/pages/lodging/HotelBookingConfirmedPage.tsx`, `src/pages/lodging/HotelRoomCheckoutPage.tsx`, plus 26 more |
| `profiles` | bus, checkout_payment, flight, hotel, support_admin | 23 | `src/pages/ChatHubPage.tsx`, `src/pages/Profile.tsx`, `src/pages/ReelsFeedPage.tsx`, `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/pages/admin/AdminFlightOrders.tsx`, plus 18 more |
| `restaurants` | bus, checkout_payment, flight, hotel, rental_car | 21 | `src/pages/EatsRestaurantDashboard.tsx`, `src/pages/EatsTrackingPage.tsx`, `src/pages/MultiStopRideBuilder.tsx`, `src/pages/NetworkPlacesPage.tsx`, `src/pages/PartnerLogin.tsx`, plus 16 more |
| `ride_requests` | bus, checkout_payment, flight, hotel | 19 | `src/pages/ReceiptsPage.tsx`, `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/pages/admin/AdminDriverModerationPage.tsx`, `src/pages/admin/AdminFinanceSummaryPage.tsx`, `src/pages/admin/AdminRefundsPage.tsx`, plus 14 more |
| `food_orders` | checkout_payment, flight, hotel, rental_car | 17 | `src/pages/EatsLanding.tsx`, `src/pages/EatsRestaurantDashboard.tsx`, `src/pages/EatsTrackingPage.tsx`, `src/pages/HistoryPage.tsx`, `src/pages/admin/AdminAnalyticsDashboard.tsx`, plus 12 more |
| `flight_bookings` | checkout_payment, flight, hotel, support_admin | 14 | `src/pages/HistoryPage.tsx`, `src/pages/MorePage.tsx`, `src/pages/MyFlightTripPage.tsx`, `src/pages/admin/AdminFlightOrders.tsx`, `src/hooks/useFlightArrivalPickup.ts`, plus 9 more |
| `customer_wallet_transactions` | checkout_payment, hotel | 14 | `src/pages/admin/AdminFinanceSummaryPage.tsx`, `src/pages/admin/AdminSystemHealth.tsx`, `src/pages/admin/AdminWalletPage.tsx`, `src/pages/app/personal/PersonalPayStubsPage.tsx`, `src/hooks/useCustomerWallet.ts`, plus 9 more |
| `car_rental_reservations` | checkout_payment, rental_car, support_admin | 13 | `src/pages/admin/CarRentalDailySheetPage.tsx`, `src/pages/admin/CarRentalReceiptPage.tsx`, `src/pages/car-rental/MyCarRentalsPage.tsx`, `src/pages/car-rental/PublicCarRentalBookingDetailPage.tsx`, `src/hooks/car-rental/useCarRentalReservations.ts`, plus 8 more |
| `shopping_orders` | checkout_payment, flight | 10 | `src/pages/DriverShoppingList.tsx`, `src/pages/driver/DriverShopPage.tsx`, `src/pages/grocery/GroceryOrderTracking.tsx`, `supabase/functions/cancel-grocery-order/index.ts`, `supabase/functions/confirm-grocery-payment/index.ts`, plus 5 more |
| `lodge_rooms` | checkout_payment, hotel | 10 | `src/pages/MyLodgingTripPage.tsx`, `src/pages/StoreMapPage.tsx`, `src/pages/StoresListPage.tsx`, `src/pages/admin/lodging/AdminLodgingReservationDetailPage.tsx`, `src/pages/lodging/HotelsLandingPage.tsx`, plus 5 more |
| `customer_wallets` | checkout_payment | 10 | `src/pages/admin/AdminWalletPage.tsx`, `src/hooks/useCustomerWallet.ts`, `src/hooks/useWalletPayment.ts`, `supabase/functions/_shared/tipWalletCredit.ts`, `supabase/functions/connect-instant-payout/index.ts`, plus 5 more |
| `lodge_room_blocks` | bus, checkout_payment, hotel | 9 | `src/pages/MyLodgingTripPage.tsx`, `src/hooks/lodging/useLodgeBlocks.ts`, `src/hooks/lodging/useRoomAvailability.ts`, `supabase/functions/approve-lodging-change/index.ts`, `supabase/functions/lodging-addon-eligibility/index.ts`, plus 4 more |
| `customer_payout_methods` | checkout_payment, hotel | 9 | `src/pages/account/WalletPage.tsx`, `src/pages/admin/AdminDriverPayoutsPage.tsx`, `src/pages/admin/AdminWalletPage.tsx`, `src/pages/driver/DriverPayoutsPage.tsx`, `supabase/functions/customer-payout-method-record/index.ts`, plus 4 more |
| `user_roles` | bus, checkout_payment, hotel, rental_car | 9 | `src/hooks/useUserAccess.ts`, `supabase/functions/admin-post-comment/index.ts`, `supabase/functions/admin-update-profile/index.ts`, `supabase/functions/approve-lodging-change/index.ts`, `supabase/functions/ar-receipts-helper/index.ts`, plus 4 more |
| `creator_tips` | bus, checkout_payment, flight | 8 | `src/pages/MonetizationPage.tsx`, `supabase/functions/capture-tip-paypal-order/index.ts`, `supabase/functions/create-tip-checkout/index.ts`, `supabase/functions/create-tip-payment-intent/index.ts`, `supabase/functions/create-tip-square-checkout/index.ts`, plus 3 more |
| `car_rental_vehicles` | rental_car | 8 | `src/pages/car-rental/PublicCarRentalBookingDetailPage.tsx`, `src/pages/car-rental/PublicCarRentalBookingPage.tsx`, `src/hooks/car-rental/useCarRentalSidebarBadges.ts`, `src/hooks/car-rental/useCarRentalVehicles.ts`, `supabase/functions/car-rental-blackout-manage/index.ts`, plus 3 more |
| `creator_subscriptions` | bus, checkout_payment, flight, hotel | 7 | `src/pages/MonetizationPage.tsx`, `src/pages/Profile.tsx`, `supabase/functions/cancel-creator-subscription/index.ts`, `supabase/functions/confirm-tier-subscription/index.ts`, `supabase/functions/notifications-cron/index.ts`, plus 2 more |
| `salon_bookings` | checkout_payment, flight, hotel | 7 | `src/pages/admin/SalonReceiptPage.tsx`, `supabase/functions/charge-salon-no-show-fee/index.ts`, `supabase/functions/charge-salon-tip/index.ts`, `supabase/functions/create-salon-deposit/index.ts`, `supabase/functions/notifications-cron/index.ts`, plus 2 more |
| `direct_messages` | bus, checkout_payment, flight, hotel | 6 | `src/pages/ChatHubPage.tsx`, `src/pages/ReelsFeedPage.tsx`, `supabase/functions/create-p2p-transfer/index.ts`, `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/unlock-media-checkout/index.ts`, plus 1 more |
| `hotels` | flight, hotel, rental_car | 6 | `src/pages/MultiStopRideBuilder.tsx`, `src/pages/NetworkPlacesPage.tsx`, `src/pages/PartnerLogin.tsx`, `src/pages/SavedFavoritesPage.tsx`, `src/pages/app/AppTravel.tsx`, plus 1 more |
| `car_rental_store_settings` | checkout_payment, rental_car | 6 | `src/pages/car-rental/MyCarRentalsPage.tsx`, `src/pages/car-rental/PublicCarRentalBookingPage.tsx`, `src/hooks/car-rental/useCarRentalSettings.ts`, `src/lib/car-rental/money.ts`, `supabase/functions/car-rental-settings-update/index.ts`, plus 1 more |
| `car_rental_reviews` | rental_car | 6 | `src/pages/car-rental/PublicCarRentalBookingPage.tsx`, `src/pages/car-rental/PublicCarRentalReviewSubmitPage.tsx`, `src/hooks/car-rental/useCarRentalReviews.ts`, `src/hooks/car-rental/useCarRentalSidebarBadges.ts`, `supabase/functions/car-rental-review-manage/index.ts`, plus 1 more |
| `lodge_reservation_change_requests` | bus, checkout_payment, hotel | 6 | `src/hooks/lodging/useReservationChangeRequests.ts`, `supabase/functions/approve-lodging-change/index.ts`, `supabase/functions/cancel-lodging-reservation/index.ts`, `supabase/functions/purchase-lodging-addons/index.ts`, `supabase/functions/request-lodging-change/index.ts`, plus 1 more |
| `admin_notifications` | bus, checkout_payment, hotel | 6 | `supabase/functions/cancel-ride-request/index.ts`, `supabase/functions/complete-ride-request/index.ts`, `supabase/functions/resolve-bakong-ride-refund/index.ts`, `supabase/functions/resolve-driver-earning-payout/index.ts`, `supabase/functions/submit-lodging-refund-dispute/index.ts`, plus 1 more |
| `subscription_tiers` | checkout_payment | 5 | `src/pages/CreatorSetupPage.tsx`, `src/pages/MonetizationPage.tsx`, `supabase/functions/confirm-tier-subscription/index.ts`, `supabase/functions/subscribe-to-tier/index.ts`, `supabase/functions/subscribe-to-tier-intent/index.ts` |
| `feedback_submissions` | bus, checkout_payment, flight, hotel, support_admin | 5 | `src/pages/HelpCenter.tsx`, `src/pages/admin/AdminAnalyticsDashboard.tsx`, `supabase/functions/post-to-facebook-page/index.ts`, `supabase/functions/refund-request-submit/index.ts`, `supabase/functions/travel-support-submit/index.ts` |
| `notifications` | bus, checkout_payment, flight | 5 | `src/pages/MorePage.tsx`, `src/pages/account/AccountExportPage.tsx`, `src/pages/app/BusOperatorConsole.tsx`, `src/pages/app/personal/PersonalNotificationsPage.tsx`, `supabase/functions/channel-broadcast/index.ts` |
| `drivers` | checkout_payment, flight, hotel, rental_car | 5 | `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/hooks/useUserAccess.ts`, `supabase/functions/complete-ride-request/index.ts`, `supabase/functions/generate-trip-receipt/index.ts`, `supabase/functions/resolve-driver-earning-payout/index.ts` |
| `lodging_reviews` | checkout_payment, flight, hotel | 5 | `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/pages/lodging/HotelsLandingPage.tsx`, `supabase/functions/lodging-review-manage/index.ts`, `supabase/functions/lodging-review-submit/index.ts`, `supabase/functions/notifications-cron/index.ts` |
| `store_orders` | bus, checkout_payment, flight, hotel | 5 | `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/pages/admin/AdminFinanceSummaryPage.tsx`, `src/pages/app/ShopDashboard.tsx`, `src/pages/app/shop/MerchantWalletPage.tsx`, `supabase/functions/merchant-payout-request/index.ts` |
| `car_rental_customers` | checkout_payment, rental_car, support_admin | 5 | `src/pages/admin/CarRentalReceiptPage.tsx`, `src/pages/car-rental/MyCarRentalsPage.tsx`, `src/pages/car-rental/PublicCarRentalBookingPage.tsx`, `src/hooks/car-rental/useCarRentalCustomers.ts`, `supabase/functions/car-rental-customer-manage/index.ts` |
| `lodge_reservation_audit` | bus, checkout_payment, hotel | 5 | `src/pages/trips/TripDetailPage.tsx`, `src/hooks/lodging/useLodgeReservationAudit.ts`, `supabase/functions/approve-lodging-change/index.ts`, `supabase/functions/cancel-lodging-reservation/index.ts`, `supabase/functions/request-lodging-change/index.ts` |
| `ads_studio_wallet` | checkout_payment, flight | 5 | `src/hooks/useStoreAdsOverview.ts`, `supabase/functions/auto-recharge-ads-wallet/index.ts`, `supabase/functions/create-ads-wallet-topup/index.ts`, `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/verify-ads-wallet-topup/index.ts` |
| `store_payment_settings` | checkout_payment | 5 | `supabase/functions/charge-salon-no-show-fee/index.ts`, `supabase/functions/charge-salon-tip/index.ts`, `supabase/functions/create-salon-deposit/index.ts`, `supabase/functions/subscribe-salon-membership/index.ts`, `supabase/functions/sync-salon-membership-tier/index.ts` |
| `creator_profiles` | checkout_payment, flight | 4 | `src/pages/CreatorSetupPage.tsx`, `supabase/functions/creator-payout-method-record/index.ts`, `supabase/functions/creator-payout-request/index.ts`, `supabase/functions/stripe-webhook/index.ts` |
| `eats_payout_ledger` | checkout_payment, flight | 4 | `src/pages/EatsRestaurantDashboard.tsx`, `supabase/functions/cancel-eats-order/index.ts`, `supabase/functions/restaurant-cancel-order/index.ts`, `supabase/functions/stripe-webhook/index.ts` |
| `flight_price_alerts` | checkout_payment, flight, hotel, support_admin | 4 | `src/pages/FlightPriceAlertsPage.tsx`, `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/pages/admin/AdminFlightPriceAlerts.tsx`, `src/hooks/useFlightPriceAlerts.ts` |
| `user_posts` | bus, checkout_payment, flight, hotel | 4 | `src/pages/MorePage.tsx`, `src/pages/Profile.tsx`, `src/pages/ReelsFeedPage.tsx`, `src/pages/account/AccountExportPage.tsx` |
| `receipts` | checkout_payment, hotel | 4 | `src/pages/ReceiptsPage.tsx`, `src/pages/TaxInfoPage.tsx`, `supabase/functions/generate-trip-receipt/index.ts`, `supabase/functions/get-receipt-signed-url/index.ts` |
| `shop_live_pulse` | checkout_payment, flight, hotel | 4 | `src/pages/StoreMapPage.tsx`, `src/pages/StoresListPage.tsx`, `supabase/functions/meta-capi-bridge/index.ts`, `supabase/functions/stripe-webhook/index.ts` |
| `loyalty_points` | checkout_payment, flight, hotel | 4 | `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/hooks/useLoyaltyPoints.ts`, `supabase/functions/loyalty-points-manage/index.ts`, `supabase/functions/share-to-earn-manage/index.ts` |
| `driver_earnings` | checkout_payment | 4 | `src/pages/admin/AdminDriverPayoutsPage.tsx`, `supabase/functions/complete-ride-request/index.ts`, `supabase/functions/driver-payout/index.ts`, `supabase/functions/resolve-driver-earning-payout/index.ts` |
| `store_employees` | checkout_payment, hotel, support_admin | 4 | `src/pages/app/personal/PersonalSchedulePage.tsx`, `src/hooks/lodging/useLodgingPhase5Counts.ts`, `supabase/functions/ar-receipts-helper/index.ts`, `supabase/functions/lodging-ical-import/index.ts` |
| `car_rental_addons` | rental_car | 4 | `src/pages/car-rental/PublicCarRentalBookingPage.tsx`, `src/hooks/car-rental/useCarRentalAddons.ts`, `supabase/functions/car-rental-addon-manage/index.ts`, `supabase/functions/car-rental-booking-extras-submit/index.ts` |
| `car_rental_locations` | rental_car | 4 | `src/pages/car-rental/PublicCarRentalBookingPage.tsx`, `src/hooks/car-rental/useCarRentalLocations.ts`, `supabase/functions/car-rental-location-manage/index.ts`, `supabase/functions/car-rental-vehicle-manage/index.ts` |
| `car_rental_promotions` | rental_car | 4 | `src/pages/car-rental/PublicCarRentalBookingPage.tsx`, `src/hooks/car-rental/useCarRentalPromotions.ts`, `supabase/functions/car-rental-booking-extras-submit/index.ts`, `supabase/functions/car-rental-promotion-manage/index.ts` |
| `p2p_bookings` | checkout_payment, flight, rental_car | 4 | `src/pages/cars/CarRentalCheckoutPage.tsx`, `src/pages/cars/CarRentalConfirmedPage.tsx`, `src/hooks/useUnifiedTrips.ts`, `supabase/functions/stripe-webhook/index.ts` |
| `salon_stylists` | bus, checkout_payment, flight | 4 | `src/pages/salon/PublicSalonBookingPage.tsx`, `supabase/functions/connect-onboard-stylist/index.ts`, `supabase/functions/salon-commission-payout-record/index.ts`, `supabase/functions/stripe-webhook/index.ts` |
| `lodge_reservation_charges` | checkout_payment, hotel | 4 | `src/hooks/lodging/useLodgeReservationCharges.ts`, `supabase/functions/approve-lodging-change/index.ts`, `supabase/functions/lodging-reservation-receipt/index.ts`, `supabase/functions/purchase-lodging-addons/index.ts` |
| `zivo_subscriptions` | checkout_payment, flight | 4 | `src/hooks/useMembership.ts`, `supabase/functions/cancel-membership/index.ts`, `supabase/functions/check-zivo-plus/index.ts`, `supabase/functions/stripe-webhook/index.ts` |
| `ads_wallet_ledger` | checkout_payment, flight | 4 | `src/hooks/useStoreAdsOverview.ts`, `supabase/functions/auto-recharge-ads-wallet/index.ts`, `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/verify-ads-wallet-topup/index.ts` |
| `stripe_connect_accounts` | checkout_payment | 4 | `supabase/functions/connect-account-session/index.ts`, `supabase/functions/connect-instant-payout/index.ts`, `supabase/functions/connect-onboard/index.ts`, `supabase/functions/connect-status/index.ts` |
| `friendships` | bus, checkout_payment, flight, hotel | 3 | `src/pages/MorePage.tsx`, `src/pages/Profile.tsx`, `src/pages/ReelsFeedPage.tsx` |
| `user_followers` | bus, checkout_payment, flight, hotel | 3 | `src/pages/MorePage.tsx`, `src/pages/Profile.tsx`, `src/pages/ReelsFeedPage.tsx` |
| `lodge_reservation_receipts` | checkout_payment, hotel | 3 | `src/pages/MyLodgingTripPage.tsx`, `supabase/functions/lodging-reservation-receipt/index.ts`, `supabase/functions/share-lodging-receipt/index.ts` |
| `rental_cars` | flight, hotel, rental_car | 3 | `src/pages/PartnerLogin.tsx`, `src/pages/app/AppTravel.tsx`, `src/hooks/useUserAccess.ts` |
| `store_posts` | checkout_payment, flight, hotel, rental_car | 3 | `src/pages/ReelsFeedPage.tsx`, `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/pages/admin/AdminStoreEditPage.tsx` |
| `zivo_subscription_plans` | checkout_payment | 3 | `src/pages/ZivoPlusPage.tsx`, `src/hooks/useMembership.ts`, `supabase/functions/create-zivo-plus-checkout/index.ts` |
| `travel_orders` | checkout_payment, flight, hotel, rental_car | 3 | `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/hooks/useUnifiedTrips.ts`, `supabase/functions/stripe-webhook/index.ts` |
| `ride_refund_requests` | bus, checkout_payment | 3 | `src/pages/admin/AdminRefundsPage.tsx`, `supabase/functions/process-refund/index.ts`, `supabase/functions/submit-refund-request/index.ts` |
| `car_rental_reservation_addons` | checkout_payment, rental_car, support_admin | 3 | `src/pages/admin/CarRentalReceiptPage.tsx`, `src/pages/car-rental/PublicCarRentalBookingDetailPage.tsx`, `supabase/functions/car-rental-booking-extras-submit/index.ts` |
| `partner_applications` | bus | 3 | `src/pages/app/AppMore.tsx`, `src/pages/business/PartnerOnboarding.tsx`, `src/pages/business/PartnerWithZivo.tsx` |
| `flights` | flight, hotel, rental_car | 3 | `src/pages/app/AppTravel.tsx`, `supabase/functions/meta-capi-bridge/index.ts`, `supabase/functions/meta-conversion-bridge/index.ts` |
| `bus_bookings` | bus, checkout_payment | 3 | `src/pages/app/BusOperatorConsole.tsx`, `supabase/functions/capture-bus-payment/index.ts`, `supabase/functions/create-bus-payment-intent/index.ts` |
| `jobs` | checkout_payment, rental_car | 3 | `src/pages/app/RequestRidePage.tsx`, `src/hooks/useUnifiedTrips.ts`, `supabase/functions/create-payment-intent/index.ts` |
| `car_rental_vehicle_blackouts` | rental_car | 3 | `src/pages/car-rental/PublicCarRentalBookingPage.tsx`, `src/hooks/car-rental/useCarRentalBlackouts.ts`, `supabase/functions/car-rental-blackout-manage/index.ts` |
| `notification_audit` | flight, hotel | 3 | `src/hooks/lodging/useLodgingNotificationAudit.ts`, `supabase/functions/_shared/lodging-notifications.ts`, `supabase/functions/send-otp-sms/index.ts` |
| `flights_launch_settings` | checkout_payment, flight | 3 | `src/hooks/useFlightsLaunchStatus.ts`, `supabase/functions/create-flight-checkout/index.ts`, `supabase/functions/create-flight-payment-intent/index.ts` |
| `travel_offers` | checkout_payment, flight, support_admin | 3 | `src/hooks/useTravelBookings.ts`, `supabase/functions/meta-capi-bridge/index.ts`, `supabase/functions/meta-conversion-bridge/index.ts` |
| `admin_actions` | bus, checkout_payment | 3 | `supabase/functions/admin-moderate-message/index.ts`, `supabase/functions/process-refund/index.ts`, `supabase/functions/resolve-bakong-ride-refund/index.ts` |
| `wallet_transactions` | checkout_payment | 3 | `supabase/functions/cancel-eats-order/index.ts`, `supabase/functions/cancel-grocery-order/index.ts`, `supabase/functions/restaurant-cancel-order/index.ts` |
| `flight_passengers` | checkout_payment, flight | 3 | `supabase/functions/confirm-flight-payment/index.ts`, `supabase/functions/create-flight-checkout/index.ts`, `supabase/functions/create-flight-payment-intent/index.ts` |
| `driver_stripe_accounts` | checkout_payment | 3 | `supabase/functions/driver-connect-onboard/index.ts`, `supabase/functions/driver-connect-status/index.ts`, `supabase/functions/driver-payout/index.ts` |
| `gift_cards` | checkout_payment | 3 | `supabase/functions/purchase-gift-card/index.ts`, `supabase/functions/redeem-gift-card/index.ts`, `supabase/functions/verify-gift-card-purchase/index.ts` |
| `referrals` | checkout_payment | 2 | `src/pages/AffiliateHubPage.tsx`, `src/pages/MonetizationPage.tsx` |
| `public_profiles` | hotel | 2 | `src/pages/AudioRoomsPage.tsx`, `src/pages/ReelsFeedPage.tsx` |
| `trip_messages` | bus | 2 | `src/pages/ChatHubPage.tsx`, `supabase/functions/admin-moderate-message/index.ts` |
| `creator_payouts` | checkout_payment | 2 | `src/pages/CreatorPayoutsPage.tsx`, `src/hooks/useLiveEarnings.ts` |
| `creator_program_enrollments` | checkout_payment | 2 | `src/pages/CreatorSetupPage.tsx`, `src/pages/MonetizationPage.tsx` |
| `receipt-photos` | checkout_payment | 2 | `src/pages/DriverShoppingList.tsx`, `src/pages/driver/DriverShopPage.tsx` |
| `promo_codes` | checkout_payment | 2 | `src/pages/EatsLanding.tsx`, `src/pages/account/PromosPage.tsx` |
| `eats_payout_requests` | checkout_payment | 2 | `src/pages/EatsRestaurantDashboard.tsx`, `supabase/functions/eats-payout-request/index.ts` |
| `hotel_bookings` | flight, hotel | 2 | `src/pages/HistoryPage.tsx`, `src/hooks/useLiveActivityCount.ts` |
| `live_streams` | checkout_payment, flight, hotel | 2 | `src/pages/ReelsFeedPage.tsx`, `src/pages/admin/AdminAnalyticsDashboard.tsx` |
| `post_bookmarks` | flight, hotel | 2 | `src/pages/ReelsFeedPage.tsx`, `src/pages/account/AccountExportPage.tsx` |
| `post_comments` | bus, hotel | 2 | `src/pages/ReelsFeedPage.tsx`, `supabase/functions/admin-post-comment/index.ts` |
| `store_products` | checkout_payment, hotel, rental_car | 2 | `src/pages/StoreMapPage.tsx`, `src/pages/admin/AdminStoreEditPage.tsx` |
| `traveler_profiles` | flight | 2 | `src/pages/account/AccountExportPage.tsx`, `src/hooks/useTravelerProfiles.ts` |
| `analytics_events` | checkout_payment, flight, hotel | 2 | `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/pages/admin/AdminSystemHealth.tsx` |
| `deliveries` | checkout_payment, flight, hotel | 2 | `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/pages/admin/AdminFinanceSummaryPage.tsx` |
| `flight_incident_logs` | checkout_payment, flight, hotel, support_admin | 2 | `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/pages/admin/AdminFlightApiMonitoring.tsx` |
| `partner_redirect_logs` | checkout_payment, flight, hotel, support_admin | 2 | `src/pages/admin/AdminAnalyticsDashboard.tsx`, `src/hooks/useTravelBookings.ts` |
| `travel_payments` | checkout_payment, flight, hotel | 2 | `src/pages/admin/AdminAnalyticsDashboard.tsx`, `supabase/functions/stripe-webhook/index.ts` |
| `flight_api_limits` | flight, support_admin | 2 | `src/pages/admin/AdminFlightApiMonitoring.tsx`, `supabase/functions/duffel-flights/index.ts` |
| `flight_api_usage` | flight, support_admin | 2 | `src/pages/admin/AdminFlightApiMonitoring.tsx`, `supabase/functions/duffel-flights/index.ts` |
| `flight_search_logs` | flight, support_admin | 2 | `src/pages/admin/AdminFlightSearchAnalytics.tsx`, `supabase/functions/duffel-flights/index.ts` |
| `lodging_stripe_webhook_events` | checkout_payment, hotel | 2 | `src/pages/admin/AdminLodgingWebhookEventsPage.tsx`, `supabase/functions/stripe-lodging-webhook/index.ts` |
| `lodging_wiring_report_runs` | hotel | 2 | `src/pages/admin/AdminLodgingWiringCheckPage.tsx`, `supabase/functions/lodging-wiring-monitor/index.ts` |
| `store-assets` | bus, hotel | 2 | `src/pages/admin/AdminStoresPage.tsx`, `src/pages/business/BusinessPageWizard.tsx` |
| `bus_promos` | bus | 2 | `src/pages/app/BusBookingPage.tsx`, `src/pages/app/BusOperatorConsole.tsx` |
| `bus_reviews` | bus | 2 | `src/pages/app/BusOperatorConsole.tsx`, `src/pages/app/BusTicketsPage.tsx` |
| `trips` | checkout_payment, flight, hotel | 2 | `src/pages/app/RequestRidePage.tsx`, `src/hooks/useLiveActivityCount.ts` |
| `merchant_payouts` | checkout_payment | 2 | `src/pages/app/shop/MerchantWalletPage.tsx`, `supabase/functions/merchant-payout-request/index.ts` |
| `business_account_users` | bus | 2 | `src/pages/business/BusinessDashboard.tsx`, `src/hooks/useBusinessMembership.ts` |
| `business_accounts` | bus | 2 | `src/pages/business/BusinessDashboard.tsx`, `src/hooks/useBusinessAccount.ts` |
| `lodge_property_profile` | hotel | 2 | `src/pages/lodging/HotelsLandingPage.tsx`, `src/hooks/lodging/useLodgePropertyProfile.ts` |
| `salon_reviews` | bus, flight, hotel | 2 | `src/pages/salon/PublicSalonBookingPage.tsx`, `supabase/functions/notifications-cron/index.ts` |
| `cafe_tip_payout_lines` | checkout_payment | 2 | `src/hooks/cafe/useCafeBaristaLifetimeTips.ts`, `supabase/functions/cafe-tip-payout-record/index.ts` |
| `cafe_baristas` | checkout_payment | 2 | `src/hooks/cafe/useCafeTips.ts`, `supabase/functions/cafe-tip-payout-record/index.ts` |
| `cafe_tip_payouts` | checkout_payment | 2 | `src/hooks/cafe/useCafeTips.ts`, `supabase/functions/cafe-tip-payout-record/index.ts` |
| `car_rental_expenses` | rental_car | 2 | `src/hooks/car-rental/useCarRentalExpenses.ts`, `supabase/functions/car-rental-expense-manage/index.ts` |
| `car_rental_maintenance` | rental_car | 2 | `src/hooks/car-rental/useCarRentalMaintenance.ts`, `supabase/functions/car-rental-maintenance-manage/index.ts` |
| `lodge_refund_disputes` | checkout_payment, hotel | 2 | `src/hooks/lodging/useLodgingRefundDisputes.ts`, `supabase/functions/submit-lodging-refund-dispute/index.ts` |
| `store_ad_pages` | bus, checkout_payment | 2 | `src/hooks/useStoreAdsOverview.ts`, `supabase/functions/post-to-facebook-page/index.ts` |
| `notification_preferences` | flight, hotel | 2 | `supabase/functions/_shared/lodging-notifications.ts`, `supabase/functions/verify-otp-sms/index.ts` |
| `store_members` | checkout_payment | 2 | `supabase/functions/charge-salon-no-show-fee/index.ts`, `supabase/functions/sync-salon-membership-tier/index.ts` |
| `kyc_submissions` | checkout_payment, flight | 2 | `supabase/functions/create-identity-verification-session/index.ts`, `supabase/functions/stripe-webhook/index.ts` |
| `admin_driver_actions` | checkout_payment | 2 | `supabase/functions/driver-payout/index.ts`, `supabase/functions/resolve-driver-earning-payout/index.ts` |
| `trip-receipts` | checkout_payment | 2 | `supabase/functions/generate-trip-receipt/index.ts`, `supabase/functions/get-receipt-signed-url/index.ts` |

## Referenced RPCs

| Object | Domains | Files | First locations |
| --- | --- | ---: | --- |
| `has_role` | bus, checkout_payment, flight, hotel, rental_car | 24 | `supabase/functions/admin-moderate-message/index.ts`, `supabase/functions/ar-payout-record/index.ts`, `supabase/functions/cafe-tip-payout-record/index.ts`, `supabase/functions/car-rental-addon-manage/index.ts`, `supabase/functions/car-rental-blackout-manage/index.ts`, plus 19 more |
| `get_hotel_detail` | hotel | 3 | `src/pages/lodging/HotelResortDetailPage.tsx`, `src/pages/lodging/HotelsLandingPage.tsx`, `supabase/functions/hotel-ask/index.ts` |
| `lodging_wiring_report` | hotel | 2 | `src/pages/admin/AdminLodgingWiringCheckPage.tsx`, `supabase/functions/lodging-wiring-monitor/index.ts` |
| `get_car_rental_reservation` | rental_car | 2 | `src/pages/car-rental/PublicCarRentalBookingDetailPage.tsx`, `src/pages/car-rental/PublicCarRentalReviewSubmitPage.tsx` |
| `credit_coin_purchase` | checkout_payment, flight | 2 | `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/verify-coin-purchase/index.ts` |
| `credit_user_wallet_topup` | checkout_payment, flight | 2 | `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/verify-user-wallet-topup/index.ts` |
| `check_user_role` | hotel, rental_car | 1 | `src/pages/PartnerLogin.tsx` |
| `is_following` | hotel | 1 | `src/pages/ReelsFeedPage.tsx` |
| `record_post_share` | hotel | 1 | `src/pages/ReelsFeedPage.tsx` |
| `get_my_profile` | flight | 1 | `src/pages/account/AccountExportPage.tsx` |
| `create_bus_booking` | bus | 1 | `src/pages/app/BusBookingPage.tsx` |
| `get_bus_trip_seats` | bus | 1 | `src/pages/app/BusBookingPage.tsx` |
| `get_popular_bus_routes` | bus | 1 | `src/pages/app/BusBookingPage.tsx` |
| `search_bus_trips` | bus | 1 | `src/pages/app/BusBookingPage.tsx` |
| `get_my_bus_bookings` | bus | 1 | `src/pages/app/BusTicketsPage.tsx` |
| `apply_pricing_to_job` | checkout_payment | 1 | `src/pages/app/RequestRidePage.tsx` |
| `assign_job_zone_and_surge_postgis` | checkout_payment | 1 | `src/pages/app/RequestRidePage.tsx` |
| `get_employee_payroll_summary` | checkout_payment | 1 | `src/pages/app/shop/ShopPayrollPage.tsx` |
| `get_merchant_roi` | checkout_payment | 1 | `src/pages/app/shop/ShopPayrollPage.tsx` |
| `cafe_public_order_receipt` | checkout_payment | 1 | `src/pages/cafe/CafeReceiptPage.tsx` |
| `create_car_rental_app_reservation` | rental_car | 1 | `src/pages/car-rental/PublicCarRentalBookingPage.tsx` |
| `get_car_rental_availability` | rental_car | 1 | `src/pages/car-rental/PublicCarRentalBookingPage.tsx` |
| `get_car_rental_reservation_payment_status` | rental_car | 1 | `src/pages/car-rental/PublicCarRentalBookingPage.tsx` |
| `salon_public_get_payment_policy` | bus | 1 | `src/pages/salon/PublicSalonBookingPage.tsx` |
| `salon_public_store_closures` | bus | 1 | `src/pages/salon/PublicSalonBookingPage.tsx` |
| `salon_public_stylist_blockouts` | bus | 1 | `src/pages/salon/PublicSalonBookingPage.tsx` |
| `salon_public_stylist_busy` | bus | 1 | `src/pages/salon/PublicSalonBookingPage.tsx` |
| `salon_public_stylists_blockouts` | bus | 1 | `src/pages/salon/PublicSalonBookingPage.tsx` |
| `salon_public_stylists_busy` | bus | 1 | `src/pages/salon/PublicSalonBookingPage.tsx` |
| `salon_public_get_stylist_earnings` | checkout_payment | 1 | `src/pages/salon/PublicStylistEarningsPage.tsx` |
| `salon_public_get_stylist_payouts` | checkout_payment | 1 | `src/pages/salon/PublicStylistEarningsPage.tsx` |
| `unlock_dm_with_wallet` | checkout_payment | 1 | `src/hooks/useDirectMessageUnlocks.ts` |
| `get_my_user_access` | hotel, rental_car | 1 | `src/hooks/useUserAccess.ts` |
| `create_lodge_guest_reservation` | hotel | 1 | `src/lib/lodging/createLodgeReservation.ts` |
| `request_live_earnings_payout` | checkout_payment | 1 | `supabase/functions/creator-payout-request/index.ts` |
| `increment_counter` | flight | 1 | `supabase/functions/duffel-flights/index.ts` |
| `increment_flight_api_usage` | flight | 1 | `supabase/functions/duffel-flights/index.ts` |
| `process_customer_wallet_withdrawal` | checkout_payment | 1 | `supabase/functions/process-withdrawal/index.ts` |
| `fn_record_gift_transaction` | checkout_payment, flight | 1 | `supabase/functions/stripe-webhook/index.ts` |
| `is_store_owner` | checkout_payment | 1 | `supabase/functions/verify-ads-wallet-topup/index.ts` |
| `process_customer_wallet_payment` | checkout_payment | 1 | `supabase/functions/wallet-payment-deduct/index.ts` |

## Referenced Edge Functions

| Object | Domains | Files | First locations |
| --- | --- | ---: | --- |
| `send-transactional-email` | bus, checkout_payment, flight, hotel | 5 | `src/pages/FlightConfirmation.tsx`, `src/pages/admin/AdminStoresPage.tsx`, `supabase/functions/_shared/lodging-notifications.ts`, `supabase/functions/generate-trip-receipt/index.ts`, `supabase/functions/process-refund/index.ts` |
| `send-push-notification` | flight, hotel, rental_car | 3 | `src/pages/ReelsFeedPage.tsx`, `src/hooks/useCarRentalNotifications.ts`, `src/hooks/useFlightNotifications.ts` |
| `generate-trip-receipt` | checkout_payment | 3 | `supabase/functions/complete-ride-request/index.ts`, `supabase/functions/get-receipt-signed-url/index.ts`, `supabase/functions/stripe-ride-webhook/index.ts` |
| `eats-order-receipt` | checkout_payment | 2 | `src/pages/EatsTrackingPage.tsx`, `src/hooks/useOrderActions.ts` |
| `create-zivo-plus-checkout` | checkout_payment | 2 | `src/pages/ZivoPlusPage.tsx`, `src/hooks/useMembership.ts` |
| `zivo-plus-portal` | checkout_payment | 2 | `src/pages/ZivoPlusPage.tsx`, `src/hooks/useMembership.ts` |
| `customer-payout-method-record` | checkout_payment | 2 | `src/pages/account/WalletPage.tsx`, `src/pages/driver/DriverPayoutsPage.tsx` |
| `store-profile-manage` | checkout_payment, hotel, rental_car | 2 | `src/pages/admin/AdminStoreEditPage.tsx`, `src/pages/admin/AdminStoresPage.tsx` |
| `create-lodging-deposit` | checkout_payment, hotel | 2 | `src/pages/admin/lodging/AdminLodgingReservationDetailPage.tsx`, `src/pages/trips/TripDetailPage.tsx` |
| `marketing-interest-submit` | bus | 2 | `src/pages/business/APIPartners.tsx`, `src/pages/business/CorporateTravel.tsx` |
| `duffel-flights` | flight | 2 | `src/hooks/useDuffelFlights.ts`, `src/hooks/useDuffelSeatMaps.ts` |
| `travelpayouts-prices` | checkout_payment | 2 | `src/hooks/useTravelpayoutsPopularRoutes.ts`, `src/hooks/useTravelpayoutsPrices.ts` |
| `support-ticket-manage` | bus | 1 | `src/pages/ChatHubPage.tsx` |
| `verify-media-unlock` | bus | 1 | `src/pages/ChatHubPage.tsx` |
| `restaurant-cancel-order` | checkout_payment | 1 | `src/pages/EatsRestaurantDashboard.tsx` |
| `cancel-eats-order` | checkout_payment | 1 | `src/pages/EatsTrackingPage.tsx` |
| `eats-order-state-update` | checkout_payment | 1 | `src/pages/EatsTrackingPage.tsx` |
| `confirm-flight-payment` | checkout_payment, flight | 1 | `src/pages/FlightCheckout.tsx` |
| `create-flight-payment-intent` | checkout_payment, flight | 1 | `src/pages/FlightCheckout.tsx` |
| `lookup-store-id` | hotel, rental_car | 1 | `src/pages/PartnerLogin.tsx` |
| `get-receipt-signed-url` | checkout_payment, hotel | 1 | `src/pages/ReceiptsPage.tsx` |
| `account-export` | flight | 1 | `src/pages/account/AccountExportPage.tsx` |
| `create-user-wallet-topup` | checkout_payment | 1 | `src/pages/account/WalletPage.tsx` |
| `process-withdrawal` | checkout_payment | 1 | `src/pages/account/WalletPage.tsx` |
| `refund-request-submit` | checkout_payment | 1 | `src/pages/account/WalletPage.tsx` |
| `verify-user-wallet-topup` | checkout_payment | 1 | `src/pages/account/WalletPage.tsx` |
| `resolve-driver-earning-payout` | checkout_payment | 1 | `src/pages/admin/AdminDriverPayoutsPage.tsx` |
| `process-refund` | checkout_payment | 1 | `src/pages/admin/AdminRefundsPage.tsx` |
| `resolve-bakong-ride-refund` | checkout_payment | 1 | `src/pages/admin/AdminRefundsPage.tsx` |
| `store-product-manage` | checkout_payment, hotel, rental_car | 1 | `src/pages/admin/AdminStoreEditPage.tsx` |
| `create-bus-payment-intent` | bus | 1 | `src/pages/app/BusBookingPage.tsx` |
| `capture-bus-payment` | bus | 1 | `src/pages/app/BusOperatorConsole.tsx` |
| `create-payment-intent` | checkout_payment | 1 | `src/pages/app/RequestRidePage.tsx` |
| `dispatch-start` | checkout_payment | 1 | `src/pages/app/RequestRidePage.tsx` |
| `trip-estimate` | checkout_payment | 1 | `src/pages/app/RequestRidePage.tsx` |
| `service-waitlist-submit` | flight, hotel | 1 | `src/pages/app/ServicesPage.tsx` |
| `store-employee-manage` | support_admin | 1 | `src/pages/app/personal/PersonalSchedulePage.tsx` |
| `travel-support-submit` | support_admin | 1 | `src/pages/app/personal/PersonalSchedulePage.tsx` |
| `merchant-payout-request` | checkout_payment | 1 | `src/pages/app/shop/MerchantWalletPage.tsx` |
| `store-payroll-config-update` | checkout_payment | 1 | `src/pages/app/shop/ShopPayrollPage.tsx` |
| `car-rental-booking-extras-submit` | rental_car | 1 | `src/pages/car-rental/PublicCarRentalBookingPage.tsx` |
| `create-car-rental-deposit` | rental_car | 1 | `src/pages/car-rental/PublicCarRentalBookingPage.tsx` |
| `car-rental-review-submit` | rental_car | 1 | `src/pages/car-rental/PublicCarRentalReviewSubmitPage.tsx` |
| `driver-connect-onboard` | checkout_payment | 1 | `src/pages/driver/DriverPayoutsPage.tsx` |
| `driver-connect-status` | checkout_payment | 1 | `src/pages/driver/DriverPayoutsPage.tsx` |
| `cancel-grocery-order` | checkout_payment | 1 | `src/pages/grocery/GroceryOrderTracking.tsx` |
| `grocery-order-receipt` | checkout_payment | 1 | `src/pages/grocery/GroceryOrderTracking.tsx` |
| `create-salon-deposit` | bus | 1 | `src/pages/salon/PublicSalonBookingPage.tsx` |
| `salon-booking-submit` | bus | 1 | `src/pages/salon/PublicSalonBookingPage.tsx` |
| `cafe-tip-payout-record` | checkout_payment | 1 | `src/hooks/cafe/useCafeTips.ts` |
| `car-rental-addon-manage` | rental_car | 1 | `src/hooks/car-rental/useCarRentalAddons.ts` |
| `car-rental-blackout-manage` | rental_car | 1 | `src/hooks/car-rental/useCarRentalBlackouts.ts` |
| `car-rental-customer-manage` | rental_car | 1 | `src/hooks/car-rental/useCarRentalCustomers.ts` |
| `car-rental-expense-manage` | rental_car | 1 | `src/hooks/car-rental/useCarRentalExpenses.ts` |
| `car-rental-location-manage` | rental_car | 1 | `src/hooks/car-rental/useCarRentalLocations.ts` |
| `car-rental-maintenance-manage` | rental_car | 1 | `src/hooks/car-rental/useCarRentalMaintenance.ts` |
| `car-rental-promotion-manage` | rental_car | 1 | `src/hooks/car-rental/useCarRentalPromotions.ts` |
| `car-rental-reservation-manage` | rental_car | 1 | `src/hooks/car-rental/useCarRentalReservations.ts` |
| `car-rental-review-manage` | rental_car | 1 | `src/hooks/car-rental/useCarRentalReviews.ts` |
| `car-rental-settings-update` | rental_car | 1 | `src/hooks/car-rental/useCarRentalSettings.ts` |
| `car-rental-vehicle-manage` | rental_car | 1 | `src/hooks/car-rental/useCarRentalVehicles.ts` |
| `submit-lodging-refund-dispute` | checkout_payment, hotel | 1 | `src/hooks/lodging/useLodgingRefundDisputes.ts` |
| `approve-lodging-change` | hotel | 1 | `src/hooks/lodging/useReservationChangeRequests.ts` |
| `cancel-lodging-reservation` | hotel | 1 | `src/hooks/lodging/useReservationChangeRequests.ts` |
| `purchase-lodging-addons` | hotel | 1 | `src/hooks/lodging/useReservationChangeRequests.ts` |
| `request-lodging-change` | hotel | 1 | `src/hooks/lodging/useReservationChangeRequests.ts` |
| `ai-smart-deals` | flight | 1 | `src/hooks/useAISmartDeals.ts` |
| `aba-payway-checkout` | checkout_payment | 1 | `src/hooks/useAbaPayway.ts` |
| `duffel-destination-prices` | flight | 1 | `src/hooks/useDestinationPrices.ts` |
| `create-eats-payment` | checkout_payment | 1 | `src/hooks/useEatsOrder.ts` |
| `create-eats-paypal-order` | checkout_payment | 1 | `src/hooks/useEatsOrder.ts` |
| `create-eats-square-checkout` | checkout_payment | 1 | `src/hooks/useEatsOrder.ts` |
| `dispatch-eats-order` | checkout_payment | 1 | `src/hooks/useEatsOrder.ts` |
| `eats-payment-status-update` | checkout_payment | 1 | `src/hooks/useEatsOrder.ts` |
| `notify-eats-order-confirmed` | checkout_payment | 1 | `src/hooks/useEatsOrder.ts` |
| `duffel-fare-calendar` | flight | 1 | `src/hooks/useFareCalendar.ts` |
| `create-flight-checkout` | checkout_payment, flight | 1 | `src/hooks/useFlightBooking.ts` |
| `process-flight-refund` | checkout_payment, flight | 1 | `src/hooks/useFlightBooking.ts` |
| `duffel-hot-deals` | flight | 1 | `src/hooks/useHotDeals.ts` |
| `creator-payout-request` | checkout_payment | 1 | `src/hooks/useLiveEarnings.ts` |
| `loyalty-points-manage` | checkout_payment | 1 | `src/hooks/useLoyaltyPoints.ts` |
| `cancel-membership` | checkout_payment | 1 | `src/hooks/useMembership.ts` |
| `hotelbeds-hotels` | hotel | 1 | `src/hooks/useMultiProviderHotelSearch.ts` |
| `ratehawk-hotels` | hotel | 1 | `src/hooks/useMultiProviderHotelSearch.ts` |
| `creator-payout-method-record` | checkout_payment | 1 | `src/hooks/usePayPalPayout.ts` |
| `paypal-payout` | checkout_payment | 1 | `src/hooks/usePayPalPayout.ts` |
| `connect-instant-payout` | checkout_payment | 1 | `src/hooks/useStripeConnect.ts` |
| `connect-onboard` | checkout_payment | 1 | `src/hooks/useStripeConnect.ts` |
| `connect-status` | checkout_payment | 1 | `src/hooks/useStripeConnect.ts` |
| `manage-payment-methods` | checkout_payment | 1 | `src/hooks/useStripePaymentMethods.ts` |
| `create-travel-checkout` | checkout_payment | 1 | `src/hooks/useTravelCheckout.ts` |
| `wallet-payment-deduct` | checkout_payment | 1 | `src/hooks/useWalletPayment.ts` |
| `zivo-payment-method-manage` | checkout_payment | 1 | `src/hooks/useZivoWallet.ts` |
| `send-admin-alert` | hotel | 1 | `supabase/functions/lodging-wiring-monitor/index.ts` |

## Candidate Source Files

Only the first 220 rows are shown to keep this report readable.

| Domain | File | Referenced objects |
| --- | --- | --- |
| bus | `src/hooks/useBusinessAccount.ts` | table:business_accounts, table:business_authorized_drivers |
| bus | `src/hooks/useBusinessInvoices.ts` | table:invoices |
| bus | `src/hooks/useBusinessMembership.ts` | table:business_account_users |
| bus | `src/hooks/useInvoicePdfExport.ts` | - |
| bus | `src/hooks/useTypingBus.ts` | - |
| bus | `src/lib/business/dashboardRoute.test.ts` | - |
| bus | `src/lib/business/dashboardRoute.ts` | - |
| bus | `src/pages/account/BusinessInvoicesPage.tsx` | - |
| bus | `src/pages/account/LegalPoliciesPage.tsx` | - |
| bus | `src/pages/admin/AdminDriverModerationPage.tsx` | table:abuse_reports, table:driver_flags, table:ride_requests |
| bus | `src/pages/app/AppHome.tsx` | - |
| bus | `src/pages/app/AppMore.tsx` | table:partner_applications, table:profiles |
| bus | `src/pages/app/BusBookingPage.tsx` | table:bus_promos, table:store_profiles, rpc:create_bus_booking, rpc:get_bus_trip_seats, rpc:get_popular_bus_routes, fn:create-bus-payment-intent |
| bus | `src/pages/app/BusBookingPage.typecheck.tsx` | - |
| bus | `src/pages/app/BusOperatorConsole.tsx` | table:bus_bookings, table:bus_drivers, table:bus_promos, table:bus_reviews, fn:capture-bus-payment |
| bus | `src/pages/app/BusTicketsPage.tsx` | table:bus_reviews, rpc:get_my_bus_bookings |
| bus | `src/pages/app/ShopDashboard.tsx` | table:store_orders, table:store_profiles |
| bus | `src/pages/business/APIPartners.tsx` | fn:marketing-interest-submit |
| bus | `src/pages/business/BusinessAccountPage.tsx` | - |
| bus | `src/pages/business/BusinessDashboard.tsx` | table:business_account_users, table:business_accounts, table:business_invoices, table:business_policies |
| bus | `src/pages/business/BusinessLandingPage.tsx` | - |
| bus | `src/pages/business/BusinessPageWizard.test.tsx` | - |
| bus | `src/pages/business/BusinessPageWizard.tsx` | table:restaurants, table:store-assets, table:store_profiles |
| bus | `src/pages/business/BusinessSoftwarePortalPage.test.tsx` | - |
| bus | `src/pages/business/BusinessSoftwarePortalPage.tsx` | - |
| bus | `src/pages/business/CorporateTravel.tsx` | fn:marketing-interest-submit |
| bus | `src/pages/business/DataInsights.tsx` | - |
| bus | `src/pages/business/EnterpriseReady.tsx` | - |
| bus | `src/pages/business/PartnerAuditDocs.tsx` | - |
| bus | `src/pages/business/PartnerOnboarding.tsx` | table:partner_applications |
| bus | `src/pages/business/PartnerWithZivo.tsx` | table:partner_applications |
| bus | `src/pages/business/wizardPersistence.test.ts` | - |
| bus | `src/pages/business/wizardPersistence.ts` | table:profiles, table:store_profiles |
| bus | `src/pages/BusinessAccountPage.tsx` | table:business_renter_accounts |
| bus | `src/pages/ChatHubPage.tsx` | table:chat_drafts, table:chat_folder_members, table:chat_folders, table:chat_group_members, fn:support-ticket-manage, fn:verify-media-unlock |
| bus | `src/pages/Profile.tsx` | table:career_applications, table:creator_subscriptions, table:friendships, table:profiles |
| bus | `src/pages/salon/PublicSalonBookingPage.tsx` | table:salon_reviews, table:salon_services, table:salon_stylist_schedules, table:salon_stylists, rpc:salon_public_get_payment_policy, rpc:salon_public_store_closures, rpc:salon_public_stylist_blockouts, fn:create-salon-deposit, fn:salon-booking-submit |
| bus | `src/pages/store/BusinessSoftwareDownloadPage.tsx` | - |
| bus | `src/pages/ZivoTravelHome.tsx` | - |
| bus | `supabase/functions/admin-moderate-message/index.ts` | table:admin_actions, table:trip_messages, rpc:has_role |
| bus | `supabase/functions/admin-post-comment/index.ts` | table:post_comments, table:user_roles |
| bus | `supabase/functions/admin-update-profile/index.ts` | table:profiles, table:user_roles |
| bus | `supabase/functions/cancel-lodging-reservation/index.ts` | table:lodge_reservation_audit, table:lodge_reservation_change_requests, table:lodge_reservations |
| bus | `supabase/functions/capture-bus-payment/index.ts` | table:bus_bookings, table:store_profiles |
| bus | `supabase/functions/channel-broadcast/index.ts` | table:channel_posts, table:channel_subscribers, table:channels, table:notifications |
| bus | `supabase/functions/create-bus-payment-intent/index.ts` | table:bus_bookings |
| bus | `supabase/functions/create-tip-checkout/index.ts` | table:creator_tips, table:profiles |
| bus | `supabase/functions/create-tip-payment-intent/index.ts` | table:creator_tips |
| bus | `supabase/functions/post-to-facebook-page/index.ts` | table:feedback_submissions, table:store_ad_pages |
| bus | `supabase/functions/process-refund/index.ts` | table:admin_actions, table:financial_ledger, table:profiles, table:ride_refund_requests, rpc:has_role, fn:send-transactional-email |
| bus | `supabase/functions/request-lodging-change/index.ts` | table:lodge_reservation_audit, table:lodge_reservation_change_requests, table:lodge_reservations, table:lodge_room_blocks |
| bus | `supabase/functions/submit-refund-request/index.ts` | table:admin_notifications, table:ride_refund_requests, table:ride_requests |
| bus | `supabase/migrations/20260524320000_salon_public_stylist_busy.sql` | - |
| bus | `supabase/migrations/20260601194500_bus_booking_schema.sql` | - |
| bus | `supabase/migrations/20260601210000_bus_my_bookings_rpc.sql` | - |
| bus | `supabase/migrations/20260601211500_fix_bus_rls_store_owner.sql` | - |
| bus | `supabase/migrations/20260604143000_bus_search_logo_url.sql` | - |
| bus | `supabase/migrations/20260604154500_bus_operator_tables_and_popular_routes.sql` | - |
| checkout_payment | `src/data/carAffiliatePartners.ts` | - |
| checkout_payment | `src/hooks/cafe/useCafeBaristaLifetimeTips.ts` | table:cafe_tip_payout_lines |
| checkout_payment | `src/hooks/cafe/useCafeTips.ts` | table:cafe_baristas, table:cafe_payments, table:cafe_time_entries, table:cafe_tip_payouts, fn:cafe-tip-payout-record |
| checkout_payment | `src/hooks/lodging/useLodgingRefundDisputes.ts` | table:lodge_refund_disputes, fn:submit-lodging-refund-dispute |
| checkout_payment | `src/hooks/useAbaPayway.ts` | fn:aba-payway-checkout |
| checkout_payment | `src/hooks/useCustomerWallet.ts` | table:customer_wallet_transactions, table:customer_wallets |
| checkout_payment | `src/hooks/useDirectMessageUnlocks.ts` | table:direct_message_unlocks, rpc:unlock_dm_with_wallet |
| checkout_payment | `src/hooks/useEatsOrder.ts` | fn:create-eats-payment, fn:create-eats-paypal-order, fn:create-eats-square-checkout |
| checkout_payment | `src/hooks/useFlightBooking.ts` | table:flight_bookings, fn:create-flight-checkout, fn:process-flight-refund |
| checkout_payment | `src/hooks/useLiveEarnings.ts` | table:creator_payouts, table:v_creator_live_earnings, table:v_creator_live_stream_earnings, fn:creator-payout-request |
| checkout_payment | `src/hooks/useLoyaltyPoints.ts` | table:customer_wallet_transactions, table:loyalty_points, fn:loyalty-points-manage |
| checkout_payment | `src/hooks/useMembership.ts` | table:zivo_subscription_plans, table:zivo_subscriptions, fn:cancel-membership, fn:create-zivo-plus-checkout, fn:zivo-plus-portal |
| checkout_payment | `src/hooks/useOrderActions.ts` | table:food_orders, fn:eats-order-receipt |
| checkout_payment | `src/hooks/usePayPalPayout.ts` | fn:creator-payout-method-record, fn:paypal-payout |
| checkout_payment | `src/hooks/useRealCarSearch.ts` | - |
| checkout_payment | `src/hooks/useStoreAdsOverview.ts` | table:ads_studio_wallet, table:ads_wallet_ledger, table:store_ad_accounts, table:store_ad_campaigns |
| checkout_payment | `src/hooks/useStripeConnect.ts` | fn:connect-instant-payout, fn:connect-onboard, fn:connect-status |
| checkout_payment | `src/hooks/useStripePaymentMethods.ts` | fn:manage-payment-methods |
| checkout_payment | `src/hooks/useTravelBookings.ts` | table:partner_checkout_config, table:partner_redirect_logs, table:travel_bookings, table:travel_offers |
| checkout_payment | `src/hooks/useTravelCheckout.ts` | fn:create-travel-checkout |
| checkout_payment | `src/hooks/useTravelpayoutsPopularRoutes.ts` | fn:travelpayouts-prices |
| checkout_payment | `src/hooks/useTravelpayoutsPrices.ts` | fn:travelpayouts-prices |
| checkout_payment | `src/hooks/useWalletBudgets.ts` | table:zivo_budget_settings |
| checkout_payment | `src/hooks/useWalletPayment.ts` | table:customer_wallets, fn:wallet-payment-deduct |
| checkout_payment | `src/hooks/useZivoWallet.ts` | table:zivo_payment_methods, table:zivo_wallet_credits, table:zivo_wallet_transactions, fn:zivo-payment-method-manage |
| checkout_payment | `src/lib/car-dealership/uploadExpenseReceipt.ts` | - |
| checkout_payment | `src/lib/partnerDeepLinks.ts` | - |
| checkout_payment | `src/lib/payouts/payoutRails.ts` | - |
| checkout_payment | `src/lib/stripe.ts` | - |
| checkout_payment | `src/pages/account/GiftCardsPage.tsx` | - |
| checkout_payment | `src/pages/account/GiftCardSuccessPage.tsx` | - |
| checkout_payment | `src/pages/account/LegalPoliciesPage.tsx` | - |
| checkout_payment | `src/pages/account/PromosPage.tsx` | table:promo_codes |
| checkout_payment | `src/pages/account/WalletPage.tsx` | table:customer_payout_methods, fn:create-user-wallet-topup, fn:customer-payout-method-record, fn:process-withdrawal |
| checkout_payment | `src/pages/admin/AdminAnalyticsDashboard.tsx` | table:abandoned_searches, table:analytics_events, table:deliveries, table:drivers |
| checkout_payment | `src/pages/admin/AdminDriverPayoutsPage.tsx` | table:customer_payout_methods, table:driver_earnings, fn:resolve-driver-earning-payout |
| checkout_payment | `src/pages/admin/AdminFinanceSummaryPage.tsx` | table:customer_wallet_transactions, table:deliveries, table:lodge_reservations, table:ride_requests |
| checkout_payment | `src/pages/admin/AdminLodgingWebhookEventsPage.tsx` | table:lodging_stripe_webhook_events |
| checkout_payment | `src/pages/admin/AdminRefundsPage.tsx` | table:ride_refund_requests, table:ride_requests, fn:process-refund, fn:resolve-bakong-ride-refund |
| checkout_payment | `src/pages/admin/AdminStoreEditPage.tsx` | table:ar_customer_vehicles, table:ar_invoices, table:ar_work_orders, table:store-posts, fn:store-product-manage, fn:store-profile-manage |
| checkout_payment | `src/pages/admin/AdminSystemHealth.tsx` | table:admin_security_alerts, table:analytics_events, table:customer_wallet_transactions |
| checkout_payment | `src/pages/admin/AdminWalletPage.tsx` | table:customer_payout_methods, table:customer_wallet_transactions, table:customer_wallets |
| checkout_payment | `src/pages/admin/CarRentalReceiptPage.tsx` | table:car_rental_customers, table:car_rental_reservation_addons, table:car_rental_reservations, table:store_profiles |
| checkout_payment | `src/pages/admin/lodging/AdminLodgingReservationDetailPage.tsx` | table:lodge_reservations, table:lodge_rooms, fn:create-lodging-deposit |
| checkout_payment | `src/pages/admin/SalonReceiptPage.tsx` | table:salon_booking_addons, table:salon_booking_payments, table:salon_booking_retail_items, table:salon_bookings |
| checkout_payment | `src/pages/AffiliateHubPage.tsx` | table:referrals, table:wallets |
| checkout_payment | `src/pages/app/AppHome.tsx` | - |
| checkout_payment | `src/pages/app/MyTripsPage.tsx` | - |
| checkout_payment | `src/pages/app/personal/PersonalNotificationsPage.tsx` | table:notifications |
| checkout_payment | `src/pages/app/personal/PersonalPayStubsPage.tsx` | table:customer_wallet_transactions |
| checkout_payment | `src/pages/app/RequestRidePage.tsx` | table:jobs, table:surge_zones, table:trips, rpc:apply_pricing_to_job, rpc:assign_job_zone_and_surge_postgis, fn:create-payment-intent, fn:dispatch-start, fn:trip-estimate |
| checkout_payment | `src/pages/app/shop/MerchantWalletPage.tsx` | table:merchant_payouts, table:store_orders, table:store_profiles, fn:merchant-payout-request |
| checkout_payment | `src/pages/app/shop/ShopPayrollPage.tsx` | table:store_payroll_configs, table:store_profiles, rpc:get_employee_payroll_summary, rpc:get_merchant_roi, fn:store-payroll-config-update |
| checkout_payment | `src/pages/app/SupportCenterPage.tsx` | - |
| checkout_payment | `src/pages/app/UnifiedDashboard.tsx` | - |
| checkout_payment | `src/pages/cafe/CafeReceiptPage.tsx` | rpc:cafe_public_order_receipt |
| checkout_payment | `src/pages/CarCheckoutPage.tsx` | - |
| checkout_payment | `src/pages/cars/CarRentalCheckoutPage.tsx` | table:p2p_bookings, table:p2p_vehicles |
| checkout_payment | `src/pages/CoinWalletPage.tsx` | table:coin_purchases, table:coin_transactions |
| checkout_payment | `src/pages/CreatorLiveEarningsPage.tsx` | - |
| checkout_payment | `src/pages/CreatorPayoutsPage.tsx` | table:creator_payouts |
| checkout_payment | `src/pages/CreatorSetupPage.tsx` | table:creator_profiles, table:creator_program_enrollments, table:creator_promo_codes, table:subscription_tiers |
| checkout_payment | `src/pages/driver/DriverPayoutsPage.tsx` | table:customer_payout_methods, fn:customer-payout-method-record, fn:driver-connect-onboard, fn:driver-connect-status |
| checkout_payment | `src/pages/driver/DriverShopPage.tsx` | table:receipt-photos, table:shopping_orders |
| checkout_payment | `src/pages/DriverShoppingList.tsx` | table:receipt-photos, table:shopping_orders |
| checkout_payment | `src/pages/DuffelCheckout.tsx` | - |
| checkout_payment | `src/pages/EatsLanding.tsx` | table:food_orders, table:promo_codes |
| checkout_payment | `src/pages/EatsRestaurantDashboard.tsx` | table:eats_payout_ledger, table:eats_payout_requests, table:food_orders, table:menu_items, fn:restaurant-cancel-order |
| checkout_payment | `src/pages/EatsTrackingPage.tsx` | table:food_orders, table:restaurants, fn:cancel-eats-order, fn:eats-order-receipt, fn:eats-order-state-update |
| checkout_payment | `src/pages/EmbeddedCheckout.tsx` | - |
| checkout_payment | `src/pages/FlightBookingsPage.tsx` | - |
| checkout_payment | `src/pages/FlightCheckout.tsx` | fn:confirm-flight-payment, fn:create-flight-payment-intent |
| checkout_payment | `src/pages/FlightConfirmation.tsx` | fn:send-transactional-email |
| checkout_payment | `src/pages/FlightLanding.tsx` | - |
| checkout_payment | `src/pages/FlightResults.tsx` | - |
| checkout_payment | `src/pages/grocery/GroceryOrderTracking.tsx` | table:drivers_public, table:shopping_orders, fn:cancel-grocery-order, fn:grocery-order-receipt |
| checkout_payment | `src/pages/GroceryPage.tsx` | - |
| checkout_payment | `src/pages/GroceryStorePage.tsx` | - |
| checkout_payment | `src/pages/HotelResultsPage.tsx` | - |
| checkout_payment | `src/pages/legal/LimitationOfLiability.tsx` | - |
| checkout_payment | `src/pages/legal/RefundPolicy.tsx` | - |
| checkout_payment | `src/pages/lodging/HotelRoomCheckoutPage.tsx` | table:lodge_reservations, table:store_profiles |
| checkout_payment | `src/pages/MonetizationPage.tsx` | table:creator_program_enrollments, table:creator_subscriptions, table:creator_tips, table:referrals |
| checkout_payment | `src/pages/MyLodgingTripPage.tsx` | table:lodge_reservation_receipts, table:lodge_reservations, table:lodge_room_blocks, table:lodge_rooms |
| checkout_payment | `src/pages/PaymentMethodsPage.tsx` | - |
| checkout_payment | `src/pages/Profile.tsx` | table:career_applications, table:creator_subscriptions, table:friendships, table:profiles |
| checkout_payment | `src/pages/ReceiptsPage.tsx` | table:receipts, table:ride_requests, fn:get-receipt-signed-url |
| checkout_payment | `src/pages/Refunds.tsx` | - |
| checkout_payment | `src/pages/salon/PublicStylistEarningsPage.tsx` | rpc:salon_public_get_stylist_earnings, rpc:salon_public_get_stylist_payouts |
| checkout_payment | `src/pages/shop/ImportCartPage.tsx` | table:import_orders |
| checkout_payment | `src/pages/SplitBillsPage.tsx` | table:group_expense_shares, table:group_expenses |
| checkout_payment | `src/pages/StoreMapPage.tsx` | table:check_ins, table:lodge_rooms, table:promotions, table:shop_live_pulse |
| checkout_payment | `src/pages/StoreProfilePage.tsx` | - |
| checkout_payment | `src/pages/StoresListPage.tsx` | table:lodge_rooms, table:shop_live_pulse, table:store_profiles |
| checkout_payment | `src/pages/TaxInfoPage.tsx` | table:receipts |
| checkout_payment | `src/pages/TransactionsPage.tsx` | table:transactions |
| checkout_payment | `src/pages/TravelCheckoutPage.tsx` | - |
| checkout_payment | `src/pages/TravelConfirmationPage.tsx` | - |
| checkout_payment | `src/pages/ZivoPlusPage.tsx` | table:zivo_subscription_plans, fn:create-zivo-plus-checkout, fn:zivo-plus-portal |
| checkout_payment | `supabase/functions/_shared/stripe.ts` | - |
| checkout_payment | `supabase/functions/_shared/tipWalletCredit.ts` | table:customer_wallet_transactions, table:customer_wallets |
| checkout_payment | `supabase/functions/_shared/transactional-email-templates/eats-refund-issued.tsx` | - |
| checkout_payment | `supabase/functions/_shared/transactional-email-templates/lodging-receipt-ready.tsx` | - |
| checkout_payment | `supabase/functions/_shared/transactional-email-templates/lodging-refund-issued.tsx` | - |
| checkout_payment | `supabase/functions/_shared/transactional-email-templates/registry.ts` | - |
| checkout_payment | `supabase/functions/aba-payway-checkout/index.ts` | - |
| checkout_payment | `supabase/functions/ads-studio-generate/index.ts` | table:ads_studio_generations, table:restaurant_wallets, table:restaurants, table:store-ad-creatives |
| checkout_payment | `supabase/functions/approve-lodging-change/index.ts` | table:lodge_reservation_audit, table:lodge_reservation_change_requests, table:lodge_reservation_charges, table:lodge_reservations |
| checkout_payment | `supabase/functions/ar-payout-record/index.ts` | table:ar_payouts, table:restaurants, table:store_profiles, rpc:has_role |
| checkout_payment | `supabase/functions/ar-receipts-helper/index.ts` | table:ar_expense_items, table:ar_expenses, table:store_employees, table:store_profiles |
| checkout_payment | `supabase/functions/auto-recharge-ads-wallet/index.ts` | table:ads_studio_wallet, table:ads_wallet_ledger |
| checkout_payment | `supabase/functions/cafe-tip-payout-record/index.ts` | table:cafe_baristas, table:cafe_tip_payout_lines, table:cafe_tip_payouts, table:store_profiles, rpc:has_role |
| checkout_payment | `supabase/functions/cancel-creator-subscription/index.ts` | table:creator_subscriptions |
| checkout_payment | `supabase/functions/cancel-eats-order/index.ts` | table:eats_payout_ledger, table:food_orders, table:wallet_transactions |
| checkout_payment | `supabase/functions/cancel-grocery-order/index.ts` | table:shopping_orders, table:wallet_transactions |
| checkout_payment | `supabase/functions/cancel-lodging-reservation/index.ts` | table:lodge_reservation_audit, table:lodge_reservation_change_requests, table:lodge_reservations |
| checkout_payment | `supabase/functions/cancel-membership/index.ts` | table:zivo_subscriptions |
| checkout_payment | `supabase/functions/cancel-ride-request/index.ts` | table:admin_notifications, table:ride_requests |
| checkout_payment | `supabase/functions/capture-bus-payment/index.ts` | table:bus_bookings, table:store_profiles |
| checkout_payment | `supabase/functions/capture-car-rental-balance/index.ts` | table:car_rental_reservations |
| checkout_payment | `supabase/functions/capture-ride-payment/index.ts` | table:ride_requests |
| checkout_payment | `supabase/functions/capture-ride-tip/index.ts` | table:creator_earnings, table:ride_requests |
| checkout_payment | `supabase/functions/capture-tip-paypal-order/index.ts` | table:creator_tips |
| checkout_payment | `supabase/functions/charge-salon-no-show-fee/index.ts` | table:salon_bookings, table:store_members, table:store_payment_settings |
| checkout_payment | `supabase/functions/charge-salon-tip/index.ts` | table:salon_bookings, table:store_payment_settings |
| checkout_payment | `supabase/functions/check-zivo-plus/index.ts` | table:zivo_subscriptions |
| checkout_payment | `supabase/functions/complete-ride-request/index.ts` | table:admin_notifications, table:commission_settings, table:driver_earnings, table:drivers, rpc:has_role, fn:generate-trip-receipt |
| checkout_payment | `supabase/functions/confirm-flight-payment/index.ts` | table:flight_bookings, table:flight_passengers |
| checkout_payment | `supabase/functions/confirm-grocery-payment/index.ts` | table:shopping_orders |
| checkout_payment | `supabase/functions/confirm-tier-subscription/index.ts` | table:creator_subscriptions, table:subscription_tiers |
| checkout_payment | `supabase/functions/connect-account-session/index.ts` | table:stripe_connect_accounts |
| checkout_payment | `supabase/functions/connect-instant-payout/index.ts` | table:customer_wallet_transactions, table:customer_wallets, table:stripe_connect_accounts |
| checkout_payment | `supabase/functions/connect-onboard-stylist/index.ts` | table:salon_stylists, table:store_profiles |
| checkout_payment | `supabase/functions/connect-onboard/index.ts` | table:stripe_connect_accounts |
| checkout_payment | `supabase/functions/connect-status/index.ts` | table:stripe_connect_accounts |
| checkout_payment | `supabase/functions/create-ads-wallet-topup/index.ts` | table:ads_studio_wallet |
| checkout_payment | `supabase/functions/create-bus-payment-intent/index.ts` | table:bus_bookings |
| checkout_payment | `supabase/functions/create-car-rental-deposit/index.ts` | table:car_rental_payment_attempts, table:car_rental_reservations, table:car_rental_store_settings |
| checkout_payment | `supabase/functions/create-coin-checkout/index.ts` | - |
| checkout_payment | `supabase/functions/create-coin-payment-intent/index.ts` | - |
| checkout_payment | `supabase/functions/create-eats-payment/index.ts` | table:food_orders |
| checkout_payment | `supabase/functions/create-eats-square-checkout/index.ts` | table:food_orders |
| checkout_payment | `supabase/functions/create-flight-checkout/index.ts` | table:flight_bookings, table:flight_passengers, table:flights_launch_settings, rpc:has_role |
| checkout_payment | `supabase/functions/create-flight-payment-intent/index.ts` | table:flight_bookings, table:flight_passengers, table:flights_launch_settings, rpc:has_role |
| checkout_payment | `supabase/functions/create-grocery-checkout/index.ts` | table:shopping_orders |
| checkout_payment | `supabase/functions/create-grocery-payment-intent/index.ts` | table:shopping_orders |
| checkout_payment | `supabase/functions/create-grocery-square-checkout/index.ts` | table:shopping_orders |
| checkout_payment | `supabase/functions/create-identity-verification-session/index.ts` | table:kyc_submissions |
| checkout_payment | `supabase/functions/create-lodging-deposit/index.ts` | table:lodge_reservations, table:lodging_deposit_retry_attempts |
| checkout_payment | `supabase/functions/create-lodging-square-checkout/index.ts` | table:lodge_reservations |
| checkout_payment | `supabase/functions/create-p2p-transfer/index.ts` | table:customer_wallets, table:direct_messages, table:p2p_transfers |
| checkout_payment | `supabase/functions/create-payment-intent/index.ts` | table:jobs |
| checkout_payment | `supabase/functions/create-reel-boost/index.ts` | - |
| checkout_payment | `supabase/functions/create-ride-payment-intent/index.ts` | table:city_pricing, table:ride_requests |
| checkout_payment | `supabase/functions/create-ride-payment/index.ts` | table:ride_requests |
| checkout_payment | `supabase/functions/create-salon-deposit/index.ts` | table:salon_bookings, table:store_payment_settings, table:store_profiles |
| checkout_payment | `supabase/functions/create-tip-checkout/index.ts` | table:creator_tips, table:profiles |
| checkout_payment | `supabase/functions/create-tip-payment-intent/index.ts` | table:creator_tips |
| checkout_payment | `supabase/functions/create-tip-square-checkout/index.ts` | table:creator_tips |
| checkout_payment | `supabase/functions/create-user-wallet-topup/index.ts` | - |
| checkout_payment | `supabase/functions/create-zivo-plus-checkout/index.ts` | table:zivo_subscription_plans |
| checkout_payment | `supabase/functions/creator-payout-method-record/index.ts` | table:creator_profiles |

## Cutover Recommendation

1. Bus booking first: smallest product workflow, clear customer route, fewer provider/payment dependencies than flights.
2. Rental car customer booking next: move public search/checkout while keeping fleet owner consoles outside Travel until ownership is confirmed.
3. Hotels after provider and owner-console split is clear: customer hotel search/booking belongs in Travel; hotel/resort operations may belong in Zivo Software owner consoles.
4. Flights last among core booking products: provider secrets, ticketing, cancellation, support, compliance, and webhooks make it the highest-risk travel workflow.
5. Keep checkout, wallet, refunds, payout, and staff monitoring central until Zivo-Admin and payment audit boundaries exist.
