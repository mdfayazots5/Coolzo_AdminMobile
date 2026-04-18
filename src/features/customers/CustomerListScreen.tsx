/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { FilterBar } from "@/components/shared/FilterBar"
import { CustomerCard } from "@/components/shared/CustomerCard"
import { customerRepository, Customer } from "@/core/network/customer-repository"
import { Plus, Users, Search, Filter, LayoutGrid, List } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function CustomerListScreen() {
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = React.useState<Customer[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerRepository.getCustomers({});
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomers();
  }, [])

  const handleSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const filtered = customers.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      c.phone.includes(query) ||
      c.email.toLowerCase().includes(lowerQuery)
    );
    setFilteredCustomers(filtered);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Customer Management</h1>
          <p className="text-sm text-brand-muted">View and manage all customer records and history</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-brand-navy/5 p-1 rounded-lg border border-brand-navy/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'grid' ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-navy"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list' ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-navy"
              )}
            >
              <List size={18} />
            </button>
          </div>
          <AdminButton 
            onClick={() => navigate('/customers/create')}
            iconLeft={<Plus size={18} />}
          >
            Add Customer
          </AdminButton>
        </div>
      </div>

      <FilterBar 
        onSearch={handleSearch}
        onFilter={() => toast.info("Advanced filters coming soon")}
        placeholder="Search by name, phone, or email..."
      />

      {isLoading ? (
        <InlineLoader />
      ) : (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <CustomerCard 
                  customer={customer} 
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className={viewMode === 'list' ? "flex flex-row items-center gap-6" : ""}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
