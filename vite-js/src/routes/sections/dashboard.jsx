import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { AuthGuard } from 'src/auth/guard';
import DashboardLayout from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import Milestone from 'src/sections/Supply-Chain/view/Milestone';
import { View } from '@react-pdf/renderer';
import CompletePurchaseOrderForm from 'src/sections/Supply-Chain/view/Add-Order';
import CompletePurchaseOrderFormEdit from 'src/sections/Supply-Chain/view/purchase-order-edit';

// ----------------------------------------------------------------------

// OVERVIEW
const IndexPage = lazy(() => import('src/pages/dashboard/app'));
const OverviewEcommercePage = lazy(() => import('src/pages/dashboard/ecommerce'));
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
const OverviewBankingPage = lazy(() => import('src/pages/dashboard/banking'));
const OverviewBookingPage = lazy(() => import('src/pages/dashboard/booking'));
const OverviewFilePage = lazy(() => import('src/pages/dashboard/file'));
// PRODUCT
const ProductDetailsPage = lazy(() => import('src/pages/dashboard/product/details'));
const ProductListPage = lazy(() => import('src/pages/dashboard/product/list'));
const ProductCreatePage = lazy(() => import('src/pages/dashboard/product/new'));
const ProductEditPage = lazy(() => import('src/pages/dashboard/product/edit'));
// ORDER
const OrderListPage = lazy(() => import('src/pages/dashboard/order/list'));
const OrderDetailsPage = lazy(() => import('src/pages/dashboard/order/details'));
// INVOICE
const InvoiceListPage = lazy(() => import('src/pages/dashboard/invoice/list'));
const InvoiceDetailsPage = lazy(() => import('src/pages/dashboard/invoice/details'));
const InvoiceCreatePage = lazy(() => import('src/pages/dashboard/invoice/new'));
const InvoiceEditPage = lazy(() => import('src/pages/dashboard/invoice/edit'));
// ✅ SUPPLY CHAIN PAGES
const UserProfilePage = lazy(() => import('src/sections/Supply-Chain/view/My-Order'));
const UserCardsPage = lazy(() => import('src/sections/Supply-Chain/view/Quick-Search'));
const UserListPage = lazy(() => import('src/sections/Supply-Chain/view/user-list-view'));
// const UserAccountPage = lazy(() => import('src/sections/Supply-Chain/view/Account')); // Agar Account.jsx hai
const UserCreatePage = lazy(() => import('src/sections/Supply-Chain/view/user-create-view'));
const UserEditPage = lazy(() => import('src/sections/Supply-Chain/view/user-edit-view'));
const AddOrderPage = lazy(() => import('src/sections/Supply-Chain/view/Add-Order'));
const MilestonePage = lazy(() => import('src/sections/Supply-Chain/view/Milestone'));
const view = lazy(() => import('src/sections/Supply-Chain/view/'));
const TNAChartPage = lazy(() => import('src/sections/Supply-Chain/view/TNA-Chart'));
const CancellationsPage = lazy(() => import('src/sections/Supply-Chain/view/Cancellations'));
const OrderTrackingPage = lazy(() => import('src/sections/Supply-Chain/view/Orders-tracking'));
const MerchantInquiryPage = lazy(() => import('src/sections/Supply-Chain/view/Merchant-inquiry'));
const OrderDetailPage = lazy(() => import('src/sections/Supply-Chain/view/Order-detail'));
const SamplingProgramPage = lazy(() => import('src/sections/Supply-Chain/view/Sampling-program'));
const AddSamplingProgramPage = lazy(
  () => import('src/sections/Supply-Chain/view/Add-sampling-program')
);
const AddInquiryPage = lazy(() => import('src/sections/Supply-Chain/view/Add-inquiry'));
const AddOrderDetailPage = lazy(() => import('src/sections/Supply-Chain/view/Add-order-detail'));
const PurchaseOrderPDF = lazy(() => import('src/sections/Supply-Chain/PurchaseOrderPDF'));
const PurchaseOrderSSPDF = lazy(() => import('src/sections/Supply-Chain/PurchaseOrderSSPDF'));
const EditOrder = lazy(() =>
  import('src/sections/Supply-Chain/view/edit-order')
);

// Power_TOOL
const ProcessBoardPage = lazy(() => import('src/sections/power-tool/view/Process-board'));
const ProductCategoriesPage = lazy(() => import('src/sections/power-tool/Product-categories'));
const PowerToolOrderDetailPage = lazy(() => import('src/sections/power-tool/view/Oder-detail'));
const ProductGroupPage = lazy(() => import('src/sections/power-tool/view/Product-group'));
const AddGroupPage = lazy(() => import('src/sections/power-tool/view/Add-group'));
const BookedExchangeRatePage = lazy(
  () => import('src/sections/power-tool/view/Booked-Exchange-Rate')
);
const ShippedExchangeRatePage = lazy(
  () => import('src/sections/power-tool/view/Shipped-Exchange-Rate')
);
const SizeRangeDatabasePage = lazy(
  () => import('src/sections/power-tool/view/Size-Range-Database')
);
const AddSizeRangePage = lazy(() => import('src/sections/power-tool/view/Add-Size-Range'));
const AddSizePage = lazy(() => import('src/sections/power-tool/view/Add-Size'));
const AdvancePaymentPage = lazy(() => import('src/sections/power-tool/view/Advance-payment'));
const AddAdvancePage = lazy(() => import('src/sections/power-tool/view/Add-Advance'));
const ICRFormPage = lazy(() => import('src/sections/power-tool/view/ICR-Form'));
const QRViewPage = lazy(() => import('src/sections/power-tool/view/QR-View'));
const CostSheetViewPage = lazy(() => import('src/sections/power-tool/view/Cost-Sheet-View'));
const CostSheetEntryPage = lazy(() => import('src/sections/power-tool/view/cost-sheet-entry'));
const CourierPackagingViewPage = lazy(
  () => import('src/sections/power-tool/view/Courier-packaging-view')
);
const CourierPackagingEntryPage = lazy(
  () => import('src/sections/power-tool/view/courier-packaging-entry')
);
const ViewUsersPage = lazy(() => import('src/sections/power-tool/view/view-users'));
const ConsigneeViewPage = lazy(() => import('src/sections/power-tool/view/Consignee-view'));
const AddConsigneePage = lazy(() => import('src/sections/power-tool/view/Add-Consignee'));
const ContainerHandlingViewPage = lazy(
  () => import('src/sections/power-tool/view/Container-handling-view')
);
const ContainerHandlingReportPage = lazy(
  () => import('src/sections/power-tool/view/Container-handling-report')
);
const ContainerHandlingExpensesPage = lazy(
  () => import('src/sections/power-tool/view/Container-handling-expenses')
);
const MeasurementPointsPage = lazy(
  () => import('src/sections/power-tool/view/Measurement-points')
);
const MixCartonEntryPage = lazy(
  () => import('src/sections/power-tool/view/mix-carton-entry')
);
const AddUserPage = lazy(
  () => import('src/sections/power-tool/view/add-user')
);

// BLOG
const BlogPostsPage = lazy(() => import('src/pages/dashboard/post/list'));
const BlogPostPage = lazy(() => import('src/pages/dashboard/post/details'));
const BlogNewPostPage = lazy(() => import('src/pages/dashboard/post/new'));
const BlogEditPostPage = lazy(() => import('src/pages/dashboard/post/edit'));
// JOB
const JobDetailsPage = lazy(() => import('src/pages/dashboard/job/details'));
const JobListPage = lazy(() => import('src/pages/dashboard/job/list'));
const JobCreatePage = lazy(() => import('src/pages/dashboard/job/new'));
const JobEditPage = lazy(() => import('src/pages/dashboard/job/edit'));
// TOUR
const TourDetailsPage = lazy(() => import('src/pages/dashboard/tour/details'));
const TourListPage = lazy(() => import('src/pages/dashboard/tour/list'));
const TourCreatePage = lazy(() => import('src/pages/dashboard/tour/new'));
const TourEditPage = lazy(() => import('src/pages/dashboard/tour/edit'));
// FILE MANAGER
const FileManagerPage = lazy(() => import('src/pages/dashboard/file-manager'));
// APP
const ChatPage = lazy(() => import('src/pages/dashboard/chat'));
const MailPage = lazy(() => import('src/pages/dashboard/mail'));
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));
const KanbanPage = lazy(() => import('src/pages/dashboard/kanban'));
// TEST RENDER PAGE BY ROLE
const PermissionDeniedPage = lazy(() => import('src/pages/dashboard/permission'));
// BLANK PAGE
const BlankPage = lazy(() => import('src/pages/dashboard/blank'));

// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      // <AuthGuard>
      <DashboardLayout>
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </DashboardLayout>
      /* </AuthGuard> */
    ),
    children: [
      { element: <IndexPage />, index: true },
      { path: 'customers', element: <OverviewEcommercePage /> },
      { path: 'supplier', element: <OverviewAnalyticsPage /> },
      { path: 'banking', element: <OverviewBankingPage /> },
      { path: 'booking', element: <OverviewBookingPage /> },
      { path: 'file', element: <OverviewFilePage /> },
      {
        path: 'supply-chain',
        children: [
          { element: <UserProfilePage />, index: true },
          { path: 'profile', element: <UserProfilePage /> },
          { path: 'add-order', element: <AddOrderPage /> },
          { path: 'quick-search', element: <UserCardsPage /> },
          { path: 'list', element: <UserListPage /> },
          { path: 'new', element: <UserCreatePage /> },
          { path: ':id/edit', element: <UserEditPage /> },
          // { path: 'account', element: <UserAccountPage /> },
          { path: 'cancellations', element: <CancellationsPage /> },
          { path: 'order-tracking', element: <OrderTrackingPage /> },
          { path: 'merchant-inquiry', element: <MerchantInquiryPage /> },
          { path: 'order-detail', element: <OrderDetailPage /> },
          { path: 'sampling-program', element: <SamplingProgramPage /> },
          { path: 'add-sampling-program', element: <AddSamplingProgramPage /> },
          { path: 'add-inquiry', element: <AddInquiryPage /> },
          { path: 'add-order-detail', element: <AddOrderDetailPage /> },
          { path: 'milestone/:id', element: <Milestone /> },
          { path: 'tna-chart', element: <TNAChartPage /> },
          { path: 'view/:id', element: <CompletePurchaseOrderFormEdit /> },
          { path: 'purchase-order-pdf/:id', element: <PurchaseOrderPDF /> },
          { path: 'purchase-order-sspdf/:id', element: <PurchaseOrderSSPDF /> },
          { path: 'edit-order', element: <EditOrder /> },
          { path: 'purchase-order-edit/:id', element: <CompletePurchaseOrderFormEdit /> },
        ],
      },

      {
        path: 'power-tool',
        children: [
          { element: <ProcessBoardPage />, index: true },
          { path: 'process-board', element: <ProcessBoardPage /> },
          { path: 'product-categories', element: <ProductCategoriesPage /> },
          { path: 'order-detail', element: <PowerToolOrderDetailPage /> },
          { path: 'product-group', element: <ProductGroupPage /> },
          { path: 'add-group', element: <AddGroupPage /> },
          { path: 'booked-exchange-rate', element: <BookedExchangeRatePage /> },
          { path: 'shipped-exchange-rate', element: <ShippedExchangeRatePage /> },
          { path: 'size-range-database', element: <SizeRangeDatabasePage /> }, // ✅ correct
          { path: 'add-size-range', element: <AddSizeRangePage /> },
          { path: 'add-size', element: <AddSizePage /> }, // ✅ correct
          { path: 'advance-payment', element: <AdvancePaymentPage /> },
          { path: 'add-advance', element: <AddAdvancePage /> },
          { path: 'icr-form', element: <ICRFormPage /> },
          { path: 'qr-view', element: <QRViewPage /> },
          { path: 'view-users', element: <ViewUsersPage /> },
          { path: 'cost-sheet-view', element: <CostSheetViewPage /> },
          { path: 'cost-sheet-entry', element: <CostSheetEntryPage /> },
          { path: 'courier-packaging-view', element: <CourierPackagingViewPage /> },
          { path: 'courier-packaging-entry', element: <CourierPackagingEntryPage /> },
          { path: 'consignee', element: <ConsigneeViewPage /> },
          { path: 'add-consignee', element: <AddConsigneePage /> },
          { path: 'container-handling', element: <ContainerHandlingViewPage /> },
          { path: 'container-handling-report', element: <ContainerHandlingReportPage /> },
          { path: 'container-handling-expenses', element: <ContainerHandlingExpensesPage /> },
          { path: 'measurement-points', element: <MeasurementPointsPage /> },
          { path: 'mix-carton-entry', element: <MixCartonEntryPage /> },
          { path: 'add-user', element: <AddUserPage /> },
        ],
      },

      // {
      //   path: 'product',
      //   children: [
      //     { element: <ProductListPage />, index: true },
      //     { path: 'list', element: <ProductListPage /> },
      //     { path: ':id', element: <ProductDetailsPage /> },
      //     { path: 'new', element: <ProductCreatePage /> },
      //     { path: ':id/edit', element: <ProductEditPage /> },
      //   ],
      // },
      // {
      //   path: 'order',
      //   children: [
      //     { element: <OrderListPage />, index: true },
      //     { path: 'list', element: <OrderListPage /> },
      //     { path: ':id', element: <OrderDetailsPage /> },
      //   ],
      // },
      // {
      //   path: 'invoice',
      //   children: [
      //     { element: <InvoiceListPage />, index: true },
      //     { path: 'list', element: <InvoiceListPage /> },
      //     { path: ':id', element: <InvoiceDetailsPage /> },
      //     { path: ':id/edit', element: <InvoiceEditPage /> },
      //     { path: 'new', element: <InvoiceCreatePage /> },
      //   ],
      // },
      // {
      //   path: 'post',
      //   children: [
      //     { element: <BlogPostsPage />, index: true },
      //     { path: 'list', element: <BlogPostsPage /> },
      //     { path: ':title', element: <BlogPostPage /> },
      //     { path: ':title/edit', element: <BlogEditPostPage /> },
      //     { path: 'new', element: <BlogNewPostPage /> },
      //   ],
      // },
      // {
      //   path: 'job',
      //   children: [
      //     { element: <JobListPage />, index: true },
      //     { path: 'list', element: <JobListPage /> },
      //     { path: ':id', element: <JobDetailsPage /> },
      //     { path: 'new', element: <JobCreatePage /> },
      //     { path: ':id/edit', element: <JobEditPage /> },
      //   ],
      // },
      // {
      //   path: 'tour',
      //   children: [
      //     { element: <TourListPage />, index: true },
      //     { path: 'list', element: <TourListPage /> },
      //     { path: ':id', element: <TourDetailsPage /> },
      //     { path: 'new', element: <TourCreatePage /> },
      //     { path: ':id/edit', element: <TourEditPage /> },
      //   ],
      // },
      // { path: 'file-manager', element: <FileManagerPage /> },
      // { path: 'mail', element: <MailPage /> },
      // { path: 'chat', element: <ChatPage /> },
      // { path: 'calendar', element: <CalendarPage /> },
      // { path: 'kanban', element: <KanbanPage /> },
      // { path: 'permission', element: <PermissionDeniedPage /> },
      // { path: 'blank', element: <BlankPage /> },
    ],
  },
];
