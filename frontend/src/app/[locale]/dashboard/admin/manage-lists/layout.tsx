import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Lists | Admin Dashboard',
  description: 'Create and manage curated lists of restaurants and places',
};

export default function ManageListsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}