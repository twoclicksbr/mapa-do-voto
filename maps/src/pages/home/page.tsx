import { useRef, useState, useEffect, useMemo, Fragment } from "react";
import * as L from "leaflet";
import { LoginModal } from "@/components/auth/login-modal";
import { useLayout } from "@/components/layouts/layout-33/components/context";
import { Toolbar, ToolbarHeading, ToolbarActions } from "@/components/layouts/layout-33/components/toolbar";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, Plus, MapPin, MapPinned, Building, Building2, Settings, Users, ShieldCheck, BookmarkCheck, Home, NotepadText, ReplaceAll, FileText, Phone, Landmark, CreditCard, DollarSign, LayoutList, LayoutDashboard, BanknoteArrowDown, BanknoteArrowUp, ScrollText, type LucideIcon } from "lucide-react";
import { useActiveCandidate } from "@/components/map/active-candidate-context";
import { MapaDoVotoMap } from "@/components/map/mapa-do-voto-map";
import { Navbar } from "@/components/layouts/layout-33/components/navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { formatRecordCount } from "@/lib/helpers";
import { useActiveTab } from "@/components/layout/active-tab-context";
import { useLoginModal } from "@/components/auth/login-modal-context";
import { GabinetesDataGrid } from "@/components/gabinetes/gabinetes-data-grid";
import { GabinetCreateModal } from "@/components/gabinetes/gabinete-create-modal";
import { GabinetEditModal } from "@/components/gabinetes/gabinete-edit-modal";
import { AppMegaMenu } from "@/components/common/app-mega-menu";
import { TypePeopleDataGrid, TypePeople } from "@/components/type-people/type-people-data-grid";
import { TypePeopleModal } from "@/components/type-people/type-people-modal";
import { TypeContactsDataGrid, TypeContact } from "@/components/type-contacts/type-contacts-data-grid";
import { TypeContactsModal } from "@/components/type-contacts/type-contacts-modal";
import { TypeAddressesDataGrid, TypeAddress } from "@/components/type-addresses/type-addresses-data-grid";
import { TypeAddressesModal } from "@/components/type-addresses/type-addresses-modal";
import { TypeDocumentsDataGrid, TypeDocument } from "@/components/type-documents/type-documents-data-grid";
import { TypeDocumentsModal } from "@/components/type-documents/type-documents-modal";
import { PeopleDataGrid, Person } from "@/components/people/people-data-grid";
import { PeopleModal } from "@/components/people/people-modal";
import { PermissionActionsDataGrid, PermissionAction } from "@/components/permission-actions/permission-actions-data-grid";
import { PermissionActionsModal } from "@/components/permission-actions/permission-actions-modal";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { FinTitlesDataGrid, FinTitle } from "@/components/financeiro/fin-titles-data-grid";
import { FinCompositionModal } from "@/components/financeiro/fin-composition-modal";
import { FinBanksDataGrid, FinBank } from "@/components/financeiro/fin-banks-data-grid";
import { FinBankModal } from "@/components/financeiro/fin-bank-modal";
import { FinPaymentMethodsDataGrid, FinPaymentMethod } from "@/components/financeiro/fin-payment-methods-data-grid";
import { FinPaymentMethodModal } from "@/components/financeiro/fin-payment-method-modal";
import { FinPaymentMethodTypesDataGrid, FinPaymentMethodType } from "@/components/financeiro/fin-payment-method-types-data-grid";
import { FinPaymentMethodTypeModal } from "@/components/financeiro/fin-payment-method-type-modal";
import { FinMegaMenu } from "@/components/financeiro/fin-mega-menu";
import { DepartmentsDataGrid, Department } from "@/components/financeiro/departments-data-grid";
import { DepartmentModal } from "@/components/financeiro/department-modal";
import { FinAccountsTree, FinAccount, ReorderItem } from "@/components/financeiro/fin-accounts-tree";
import { FinAccountModal } from "@/components/financeiro/fin-account-modal";
import { FinTitleModal } from "@/components/financeiro/fin-title-modal";
import { FinTitlesFilterModal, FinTitlesFilters } from "@/components/financeiro/fin-titles-filter-modal";
import { FinExtractDataGrid, FinExtractEntry, ExtractViewToggle, ExtractView, EXTRACT_VIEW_KEY } from "@/components/financeiro/fin-extract-data-grid";
import { PageFooter } from "@/components/common/page-footer";

const BREADCRUMB_ICONS: Record<string, LucideIcon> = {
  'Home': Home,
  'Gabinetes': Building2,
  'Pessoas': Users,
  'Cadastros': NotepadText,
  'Submódulos': ReplaceAll,
  'Documentos': FileText,
  'Tipo de Documentos': BookmarkCheck,
  'Contatos': Phone,
  'Tipo de Contato': BookmarkCheck,
  'Endereços': MapPin,
  'Tipo de Endereço': BookmarkCheck,
  'Tipo de Pessoas': BookmarkCheck,
  'Permissões': ShieldCheck,
  'Configurações': Settings,
  'Dashboard': LayoutDashboard,
  'Finanças': DollarSign,
  'Títulos a Pagar': BanknoteArrowDown,
  'Títulos a Receber': BanknoteArrowUp,
  'Bancos': Landmark,
  'Modalidades': CreditCard,
  'Tipos de Modalidade': BookmarkCheck,
  'Departamentos': Building,
  'Plano de Contas': LayoutList,
  'Extrato': ScrollText,
};

function SectionBreadcrumb({ items }: { items: string[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="flex items-center">
        {items.map((item, i) => {
          const Icon = BREADCRUMB_ICONS[item];
          return (
            <Fragment key={item}>
              <BreadcrumbItem className="inline-flex items-center">
                {i < items.length - 1 ? (
                  <span className="inline-flex items-center gap-1 leading-none">{Icon && <Icon className="size-3.5 shrink-0" />}{item}</span>
                ) : (
                  <BreadcrumbPage className="inline-flex items-center gap-1 leading-none">{Icon && <Icon className="size-3.5 shrink-0" />}{item}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {i < items.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function getTenantName(): string {
  const parts = window.location.hostname.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    return sub.charAt(0).toUpperCase() + sub.slice(1);
  }
  return 'Overview';
}

function getBaseDomain(): string {
  const parts = window.location.hostname.split('.');
  if (parts.length >= 3) return parts.slice(1).join('.');
  return window.location.hostname;
}

interface Tenant {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  valid_until: string;
}

export function HomePage() {
  const { isMobile } = useLayout();
  const { activeTab, setActiveTab } = useActiveTab();
  const { loggedIn } = useLoginModal();
  const { isSplit, setIsSplit } = useActiveCandidate();
  const tenantName = getTenantName();
  const isMaster = tenantName.toLowerCase() === 'master';
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantsSelected, setTenantsSelected] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [settingsSection, setSettingsSectionState] = useState<string>(
    () => localStorage.getItem('mapadovoto:settingsSection') ?? 'settings-dashboard'
  );
  const setSettingsSection = (section: string) => {
    localStorage.setItem('mapadovoto:settingsSection', section);
    setSettingsSectionState(section);
  };

  const [typePeople, setTypePeople] = useState<TypePeople[]>([]);
  const [typePeopleLoading, setTypePeopleLoading] = useState(false);
  const [typePeopleSelected, setTypePeopleSelected] = useState(0);
  const [typePeopleModalOpen, setTypePeopleModalOpen] = useState(false);
  const [editingTypePeople, setEditingTypePeople] = useState<TypePeople | null>(null);

  const [typeContacts, setTypeContacts] = useState<TypeContact[]>([]);
  const [typeContactsLoading, setTypeContactsLoading] = useState(false);
  const [typeContactsSelected, setTypeContactsSelected] = useState(0);
  const [typeContactsModalOpen, setTypeContactsModalOpen] = useState(false);
  const [editingTypeContact, setEditingTypeContact] = useState<TypeContact | null>(null);

  const [typeAddresses, setTypeAddresses] = useState<TypeAddress[]>([]);
  const [typeAddressesLoading, setTypeAddressesLoading] = useState(false);
  const [typeAddressesSelected, setTypeAddressesSelected] = useState(0);
  const [typeAddressesModalOpen, setTypeAddressesModalOpen] = useState(false);
  const [editingTypeAddress, setEditingTypeAddress] = useState<TypeAddress | null>(null);

  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([]);
  const [typeDocumentsLoading, setTypeDocumentsLoading] = useState(false);
  const [typeDocumentsSelected, setTypeDocumentsSelected] = useState(0);
  const [typeDocumentsModalOpen, setTypeDocumentsModalOpen] = useState(false);
  const [editingTypeDocument, setEditingTypeDocument] = useState<TypeDocument | null>(null);

  const [permissionActions, setPermissionActions] = useState<PermissionAction[]>([]);
  const [permissionActionsLoading, setPermissionActionsLoading] = useState(false);
  const [permissionActionsSelected, setPermissionActionsSelected] = useState(0);
  const [permissionActionsModalOpen, setPermissionActionsModalOpen] = useState(false);
  const [editingPermissionAction, setEditingPermissionAction] = useState<PermissionAction | null>(null);

  const [people, setPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleSelected, setPeopleSelected] = useState(0);
  const [peopleModalOpen, setPeopleModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const [finSection, setFinSectionState] = useState<string>(
    () => localStorage.getItem('mapadovoto:finSection') ?? 'fin-dashboard'
  );
  const setFinSection = (section: string) => {
    localStorage.setItem('mapadovoto:finSection', section);
    setFinSectionState(section);
  };

  const [finTitles, setFinTitles] = useState<FinTitle[]>([]);
  const [finTitlesLoading, setFinTitlesLoading] = useState(false);
  const [finTitlesSelected, setFinTitlesSelected] = useState(0);
  const [finTitlesAllPending, setFinTitlesAllPending] = useState(false);
  const [finTitlesSelectedIds, setFinTitlesSelectedIds] = useState<number[]>([]);
  const [finTitlesAllSamePeople, setFinTitlesAllSamePeople] = useState(false);
  const [finTitlesSelectedItems, setFinTitlesSelectedItems] = useState<FinTitle[]>([]);
  const [finCompositionModalOpen, setFinCompositionModalOpen] = useState(false);
  const [finCompositionTitles, setFinCompositionTitles] = useState<FinTitle[]>([]);
  const [finTitleModalOpen, setFinTitleModalOpen] = useState(false);
  const [editingFinTitle, setEditingFinTitle] = useState<FinTitle | null>(null);
  const [finTitleDefaultType, setFinTitleDefaultType] = useState<"income" | "expense">("expense");
  const [finTitleInitialTab, setFinTitleInitialTab] = useState("geral");
  const [finTitlesIncome, setFinTitlesIncome] = useState<FinTitle[]>([]);
  const [finTitlesIncomeLoading, setFinTitlesIncomeLoading] = useState(false);
  const [finTitlesIncomeSelected, setFinTitlesIncomeSelected] = useState(0);
  const [finTitlesIncomeAllPending, setFinTitlesIncomeAllPending] = useState(false);
  const [finTitlesIncomeSelectedIds, setFinTitlesIncomeSelectedIds] = useState<number[]>([]);
  const [finTitlesIncomeAllSamePeople, setFinTitlesIncomeAllSamePeople] = useState(false);
  const [finTitlesIncomeSelectedItems, setFinTitlesIncomeSelectedItems] = useState<FinTitle[]>([]);
  const [finTitlesFilterOpen, setFinTitlesFilterOpen] = useState(false);
  const [finTitlesFilterType, setFinTitlesFilterType] = useState<'income' | 'expense'>('expense');
  const [finTitlesFilters, setFinTitlesFilters] = useState<FinTitlesFilters>({});

  const applyFinFilters = (list: FinTitle[]) => list.filter((t) => {
    const f = finTitlesFilters;
    if (f.invoiceNumber  && !t.invoice_number?.toLowerCase().includes(f.invoiceNumber.toLowerCase())) return false;
    if (f.peopleId       && t.people_id !== f.peopleId) return false;
    if (f.documentNumber && !t.document_number?.toLowerCase().includes(f.documentNumber.toLowerCase())) return false;
    if (f.status?.length && !f.status.includes(t.status)) return false;
    if (f.dateValue && f.dateField) {
      const raw = (t as Record<string, unknown>)[f.dateField] as string | null;
      if (raw) {
        const d = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
        const v = f.dateValue;
        if (v.operator === "is"      && v.startDate && d.toDateString() !== v.startDate.toDateString()) return false;
        if (v.operator === "before"  && v.startDate && d >= v.startDate)  return false;
        if (v.operator === "after"   && v.startDate && d <= v.startDate)  return false;
        if (v.operator === "between" && v.startDate && v.endDate && (d < v.startDate || d > v.endDate)) return false;
      }
    }
    return true;
  });

  const filteredFinTitles       = useMemo(() => applyFinFilters(finTitles),       [finTitles, finTitlesFilters]);
  const filteredFinTitlesIncome = useMemo(() => applyFinFilters(finTitlesIncome), [finTitlesIncome, finTitlesFilters]);

  const [finBanks, setFinBanks] = useState<FinBank[]>([]);
  const [finBanksLoading, setFinBanksLoading] = useState(false);
  const [finBanksSelected, setFinBanksSelected] = useState(0);
  const [finBankModalOpen, setFinBankModalOpen] = useState(false);
  const [editingFinBank, setEditingFinBank] = useState<FinBank | null>(null);

  const [finPaymentMethods, setFinPaymentMethods] = useState<FinPaymentMethod[]>([]);
  const [finPaymentMethodsLoading, setFinPaymentMethodsLoading] = useState(false);
  const [finPaymentMethodsSelected, setFinPaymentMethodsSelected] = useState(0);
  const [finPaymentMethodModalOpen, setFinPaymentMethodModalOpen] = useState(false);
  const [editingFinPaymentMethod, setEditingFinPaymentMethod] = useState<FinPaymentMethod | null>(null);

  const [finPaymentMethodTypes, setFinPaymentMethodTypes] = useState<FinPaymentMethodType[]>([]);
  const [finPaymentMethodTypesLoading, setFinPaymentMethodTypesLoading] = useState(false);
  const [finPaymentMethodTypesSelected, setFinPaymentMethodTypesSelected] = useState(0);
  const [finPaymentMethodTypeModalOpen, setFinPaymentMethodTypeModalOpen] = useState(false);
  const [editingFinPaymentMethodType, setEditingFinPaymentMethodType] = useState<FinPaymentMethodType | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsSelected, setDepartmentsSelected] = useState(0);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const [finAccounts, setFinAccounts] = useState<FinAccount[]>([]);
  const [finAccountsLoading, setFinAccountsLoading] = useState(false);
  const [finAccountModalOpen, setFinAccountModalOpen] = useState(false);
  const [editingFinAccount, setEditingFinAccount] = useState<FinAccount | null>(null);
  const [parentFinAccount, setParentFinAccount] = useState<FinAccount | null>(null);

  const [finExtract, setFinExtract] = useState<FinExtractEntry[]>([]);
  const [finExtractLoading, setFinExtractLoading] = useState(false);
  const [finExtractView, setFinExtractViewState] = useState<ExtractView>(
    () => (localStorage.getItem(EXTRACT_VIEW_KEY) as ExtractView) ?? "grid"
  );
  const setFinExtractView = (v: ExtractView) => {
    localStorage.setItem(EXTRACT_VIEW_KEY, v);
    setFinExtractViewState(v);
  };

  useEffect(() => {
    if (!isMaster) return;
    setTenantsLoading(true);
    api.get<Tenant[]>('/tenants')
      .then(res => setTenants(res.data))
      .finally(() => setTenantsLoading(false));
  }, [isMaster, loggedIn]);

  useEffect(() => {
    if (!isMaster || !loggedIn) return;
    setTypePeopleLoading(true);
    api.get<TypePeople[]>('/type-people')
      .then(res => setTypePeople(res.data))
      .finally(() => setTypePeopleLoading(false));
  }, [isMaster, loggedIn]);

  useEffect(() => {
    if (!isMaster || !loggedIn) return;
    setTypeContactsLoading(true);
    api.get<TypeContact[]>('/type-contacts')
      .then(res => setTypeContacts(res.data))
      .finally(() => setTypeContactsLoading(false));
  }, [isMaster, loggedIn]);

  useEffect(() => {
    if (!isMaster || !loggedIn) return;
    setTypeAddressesLoading(true);
    api.get<TypeAddress[]>('/type-addresses')
      .then(res => setTypeAddresses(res.data))
      .finally(() => setTypeAddressesLoading(false));
  }, [isMaster, loggedIn]);

  useEffect(() => {
    if (!isMaster || !loggedIn) return;
    setTypeDocumentsLoading(true);
    api.get<TypeDocument[]>('/type-documents')
      .then(res => setTypeDocuments(res.data))
      .finally(() => setTypeDocumentsLoading(false));
  }, [isMaster, loggedIn]);

  const handleTypePeopleReorder = async (id: number, newOrder: number) => {
    await api.put(`/type-people/${id}`, { order: newOrder });
    const res = await api.get<TypePeople[]>('/type-people');
    setTypePeople(res.data);
  };

  const handleTypePeopleDelete = async (id: number) => {
    await api.delete(`/type-people/${id}`);
    setTypePeople(prev => prev.filter(tp => tp.id !== id));
  };

  const handleTypeContactsReorder = async (id: number, newOrder: number) => {
    await api.put(`/type-contacts/${id}`, { order: newOrder });
    const res = await api.get<TypeContact[]>('/type-contacts');
    setTypeContacts(res.data);
  };

  const handleTypeContactsDelete = async (id: number) => {
    await api.delete(`/type-contacts/${id}`);
    setTypeContacts(prev => prev.filter(tc => tc.id !== id));
  };

  const handleTypeAddressesReorder = async (id: number, newOrder: number) => {
    await api.put(`/type-addresses/${id}`, { order: newOrder });
    const res = await api.get<TypeAddress[]>('/type-addresses');
    setTypeAddresses(res.data);
  };

  const handleTypeAddressesDelete = async (id: number) => {
    await api.delete(`/type-addresses/${id}`);
    setTypeAddresses(prev => prev.filter(ta => ta.id !== id));
  };

  const handleTypeDocumentsReorder = async (id: number, newOrder: number) => {
    await api.put(`/type-documents/${id}`, { order: newOrder });
    const res = await api.get<TypeDocument[]>('/type-documents');
    setTypeDocuments(res.data);
  };

  const handleTypeDocumentsDelete = async (id: number) => {
    await api.delete(`/type-documents/${id}`);
    setTypeDocuments(prev => prev.filter(td => td.id !== id));
  };

  useEffect(() => {
    if (!isMaster || !loggedIn) return;
    setPermissionActionsLoading(true);
    api.get<PermissionAction[]>('/permission-actions')
      .then(res => setPermissionActions(res.data))
      .finally(() => setPermissionActionsLoading(false));
  }, [isMaster, loggedIn]);

  const handlePermissionActionDelete = async (id: number) => {
    await api.delete(`/permission-actions/${id}`);
    setPermissionActions(prev => prev.filter(pa => pa.id !== id));
  };

  useEffect(() => {
    if (!loggedIn) return;
    setPeopleLoading(true);
    api.get<Person[]>('/people')
      .then(res => setPeople(res.data))
      .finally(() => setPeopleLoading(false));
  }, [loggedIn]);

  const handlePeopleDelete = async (id: number) => {
    await api.delete(`/people/${id}`);
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  useEffect(() => {
    if (!loggedIn || finSection !== 'fin-titles-expense') return;
    setFinTitlesLoading(true);
    api.get<FinTitle[]>('/fin-titles?type=expense')
      .then(res => setFinTitles(res.data))
      .catch(() => setFinTitles([]))
      .finally(() => setFinTitlesLoading(false));
  }, [loggedIn, finSection]);

  useEffect(() => {
    if (!loggedIn || finSection !== 'fin-titles-income') return;
    setFinTitlesIncomeLoading(true);
    api.get<FinTitle[]>('/fin-titles?type=income')
      .then(res => setFinTitlesIncome(res.data))
      .catch(() => setFinTitlesIncome([]))
      .finally(() => setFinTitlesIncomeLoading(false));
  }, [loggedIn, finSection]);

  const handleFinTitleSaved = (title: FinTitle) => {
    setFinTitleModalOpen(false);
    setEditingFinTitle(null);
    if (title.type === 'expense') {
      setFinTitlesLoading(true);
      api.get<FinTitle[]>('/fin-titles?type=expense')
        .then(res => setFinTitles(res.data))
        .catch(() => {})
        .finally(() => setFinTitlesLoading(false));
    } else {
      setFinTitlesIncomeLoading(true);
      api.get<FinTitle[]>('/fin-titles?type=income')
        .then(res => setFinTitlesIncome(res.data))
        .catch(() => {})
        .finally(() => setFinTitlesIncomeLoading(false));
    }
  };

  const handleFinTitleExpenseDelete = async (id: number) => {
    await api.delete(`/fin-titles/${id}`);
    setFinTitles(prev => prev.filter(t => t.id !== id));
  };

  const handleBulkCancelExpense = async () => {
    await Promise.all(finTitlesSelectedIds.map(id => api.put(`/fin-titles/${id}`, { status: 'cancelled' })));
    setFinTitles(prev => prev.map(t => finTitlesSelectedIds.includes(t.id) ? { ...t, status: 'cancelled' } : t));
    setFinTitlesSelectedIds([]);
    setFinTitlesSelected(0);
    setFinTitlesAllPending(false);
  };

  const handleBulkCancelIncome = async () => {
    await Promise.all(finTitlesIncomeSelectedIds.map(id => api.put(`/fin-titles/${id}`, { status: 'cancelled' })));
    setFinTitlesIncome(prev => prev.map(t => finTitlesIncomeSelectedIds.includes(t.id) ? { ...t, status: 'cancelled' } : t));
    setFinTitlesIncomeSelectedIds([]);
    setFinTitlesIncomeSelected(0);
    setFinTitlesIncomeAllPending(false);
  };

  const handleFinTitleIncomeDelete = async (id: number) => {
    await api.delete(`/fin-titles/${id}`);
    setFinTitlesIncome(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (!loggedIn || finSection !== 'fin-banks') return;
    setFinBanksLoading(true);
    api.get<FinBank[]>('/fin-banks')
      .then(res => setFinBanks(res.data))
      .catch(() => setFinBanks([]))
      .finally(() => setFinBanksLoading(false));
  }, [loggedIn, finSection]);

  const handleFinBankReorder = async (id: number, newOrder: number) => {
    await api.put(`/fin-banks/${id}`, { order: newOrder });
    const res = await api.get<FinBank[]>('/fin-banks');
    setFinBanks(res.data);
  };

  const handleFinBankDelete = async (id: number) => {
    await api.delete(`/fin-banks/${id}`);
    setFinBanks(prev => prev.filter(b => b.id !== id));
  };

  useEffect(() => {
    if (!loggedIn || finSection !== 'fin-payment-methods') return;
    setFinPaymentMethodsLoading(true);
    api.get<FinPaymentMethod[]>('/fin-payment-methods')
      .then(res => setFinPaymentMethods(res.data))
      .catch(() => setFinPaymentMethods([]))
      .finally(() => setFinPaymentMethodsLoading(false));
  }, [loggedIn, finSection]);

  const handleFinPaymentMethodReorder = async (id: number, newOrder: number) => {
    await api.put(`/fin-payment-methods/${id}`, { order: newOrder });
    const res = await api.get<FinPaymentMethod[]>('/fin-payment-methods');
    setFinPaymentMethods(res.data);
  };

  const handleFinPaymentMethodDelete = async (id: number) => {
    await api.delete(`/fin-payment-methods/${id}`);
    setFinPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  useEffect(() => {
    if (!loggedIn || finSection !== 'fin-payment-method-types') return;
    setFinPaymentMethodTypesLoading(true);
    api.get<FinPaymentMethodType[]>('/fin-payment-method-types')
      .then(res => setFinPaymentMethodTypes(res.data))
      .catch(() => setFinPaymentMethodTypes([]))
      .finally(() => setFinPaymentMethodTypesLoading(false));
  }, [loggedIn, finSection]);

  const handleFinPaymentMethodTypeReorder = async (reordered: FinPaymentMethodType[]) => {
    await api.put('/fin-payment-method-types/reorder', reordered.map((t, idx) => ({ id: t.id, order: idx + 1 })));
    setFinPaymentMethodTypes(reordered.map((t, idx) => ({ ...t, order: idx + 1 })));
  };

  const handleFinPaymentMethodTypeDelete = async (id: number) => {
    await api.delete(`/fin-payment-method-types/${id}`);
    setFinPaymentMethodTypes(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (!loggedIn || finSection !== 'fin-departments') return;
    setDepartmentsLoading(true);
    api.get<Department[]>('/departments')
      .then(res => setDepartments(res.data))
      .catch(() => setDepartments([]))
      .finally(() => setDepartmentsLoading(false));
  }, [loggedIn, finSection]);

  const handleDepartmentsReorder = async (id: number, newOrder: number) => {
    await api.put(`/departments/${id}`, { order: newOrder });
    const res = await api.get<Department[]>('/departments');
    setDepartments(res.data);
  };

  const handleDepartmentDelete = async (id: number) => {
    await api.delete(`/departments/${id}`);
    setDepartments(prev => prev.filter(d => d.id !== id));
  };

  useEffect(() => {
    if (!loggedIn || finSection !== 'fin-accounts') return;
    setFinAccountsLoading(true);
    api.get<FinAccount[]>('/fin-accounts')
      .then(res => setFinAccounts(res.data))
      .catch(() => setFinAccounts([]))
      .finally(() => setFinAccountsLoading(false));
  }, [loggedIn, finSection]);

  useEffect(() => {
    if (!loggedIn || finSection !== 'fin-extract') return;
    setFinExtractLoading(true);
    api.get<FinExtractEntry[]>('/fin-extract')
      .then(res => setFinExtract(res.data))
      .catch(() => setFinExtract([]))
      .finally(() => setFinExtractLoading(false));
  }, [loggedIn, finSection]);

  const handleFinAccountsReorder = async (items: ReorderItem[]) => {
    await api.put('/fin-accounts/reorder', items);
  };

  const handleFinAccountDelete = async (id: number) => {
    await api.delete(`/fin-accounts/${id}`);
    const res = await api.get<FinAccount[]>('/fin-accounts');
    setFinAccounts(res.data);
  };

  const handleFinAccountSaved = (saved: FinAccount) => {
    // Reload full tree from server to keep hierarchy consistent
    api.get<FinAccount[]>('/fin-accounts')
      .then(res => setFinAccounts(res.data))
      .catch(() => {});
    setFinAccountModalOpen(false);
    setEditingFinAccount(null);
    setParentFinAccount(null);
  };

  const mapRef1 = useRef<L.Map | null>(null);
  const mapRef2 = useRef<L.Map | null>(null);
  const [cityBounds, setCityBounds] = useState<L.LatLngBounds | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (isSplit) {
        mapRef1.current?.invalidateSize();
        mapRef2.current?.invalidateSize();
        if (cityBounds) {
          mapRef1.current?.fitBounds(cityBounds, { padding: [40, 40], animate: false });
          mapRef2.current?.fitBounds(cityBounds, { padding: [40, 40], animate: false });
        }
      } else {
        mapRef1.current?.invalidateSize();
        if (cityBounds) {
          mapRef1.current?.fitBounds(cityBounds, { padding: [40, 40], animate: true });
        }
      }
    }, 100);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSplit]);

  const getMap2InitialView = () => {
    if (mapRef1.current) {
      return {
        center: [mapRef1.current.getCenter().lat, mapRef1.current.getCenter().lng] as L.LatLngTuple,
        zoom: mapRef1.current.getZoom(),
      };
    }
    return undefined;
  };

  return (
    <div className="container-fluid flex flex-col flex-1 min-h-0">
      <LoginModal />
      <GabinetCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(tenant) => {
          setTenants((prev) => [...prev, tenant]);
          setEditingTenant(tenant);
          api.get<Person[]>('/people').then(res => setPeople(res.data)).catch(() => {});
        }}
        existingSlugs={tenants.map((t) => t.slug)}
      />
      <GabinetEditModal
        tenant={editingTenant}
        onClose={() => setEditingTenant(null)}
        onUpdated={(updated) => setTenants((prev) => prev.map((t) => t.id === updated.id ? updated : t))}
        existingSlugs={tenants.map((t) => t.slug)}
      />
      <PermissionActionsModal
        open={permissionActionsModalOpen || !!editingPermissionAction}
        permissionAction={editingPermissionAction}
        onClose={() => { setPermissionActionsModalOpen(false); setEditingPermissionAction(null); }}
        onSaved={(saved) => {
          setPermissionActions(prev => {
            const idx = prev.findIndex(pa => pa.id === saved.id);
            return idx >= 0 ? prev.map(pa => pa.id === saved.id ? saved : pa) : [...prev, saved];
          });
          setPermissionActionsModalOpen(false);
          setEditingPermissionAction(null);
        }}
      />
      <TypePeopleModal
        open={typePeopleModalOpen || !!editingTypePeople}
        typePeople={editingTypePeople}
        onClose={() => { setTypePeopleModalOpen(false); setEditingTypePeople(null); }}
        onSaved={(saved) => {
          setTypePeople(prev => {
            const idx = prev.findIndex(tp => tp.id === saved.id);
            return idx >= 0 ? prev.map(tp => tp.id === saved.id ? saved : tp) : [...prev, saved];
          });
          setTypePeopleModalOpen(false);
          setEditingTypePeople(null);
        }}
      />
      <TypeContactsModal
        open={typeContactsModalOpen || !!editingTypeContact}
        typeContact={editingTypeContact}
        onClose={() => { setTypeContactsModalOpen(false); setEditingTypeContact(null); }}
        onSaved={(saved) => {
          setTypeContacts(prev => {
            const idx = prev.findIndex(tc => tc.id === saved.id);
            return idx >= 0 ? prev.map(tc => tc.id === saved.id ? saved : tc) : [...prev, saved];
          });
          setTypeContactsModalOpen(false);
          setEditingTypeContact(null);
        }}
      />
      <TypeAddressesModal
        open={typeAddressesModalOpen || !!editingTypeAddress}
        typeAddress={editingTypeAddress}
        onClose={() => { setTypeAddressesModalOpen(false); setEditingTypeAddress(null); }}
        onSaved={(saved) => {
          setTypeAddresses(prev => {
            const idx = prev.findIndex(ta => ta.id === saved.id);
            return idx >= 0 ? prev.map(ta => ta.id === saved.id ? saved : ta) : [...prev, saved];
          });
          setTypeAddressesModalOpen(false);
          setEditingTypeAddress(null);
        }}
      />
      <TypeDocumentsModal
        open={typeDocumentsModalOpen || !!editingTypeDocument}
        typeDocument={editingTypeDocument}
        onClose={() => { setTypeDocumentsModalOpen(false); setEditingTypeDocument(null); }}
        onSaved={(saved) => {
          setTypeDocuments(prev => {
            const idx = prev.findIndex(td => td.id === saved.id);
            return idx >= 0 ? prev.map(td => td.id === saved.id ? saved : td) : [...prev, saved];
          });
          setTypeDocumentsModalOpen(false);
          setEditingTypeDocument(null);
        }}
      />
      <FinBankModal
        open={finBankModalOpen || !!editingFinBank}
        bank={editingFinBank}
        onClose={() => { setFinBankModalOpen(false); setEditingFinBank(null); }}
        onSaved={(saved) => {
          setFinBanks(prev => {
            const idx = prev.findIndex(b => b.id === saved.id);
            return idx >= 0 ? prev.map(b => b.id === saved.id ? saved : b) : [...prev, saved];
          });
          setFinBankModalOpen(false);
          setEditingFinBank(null);
        }}
      />
      <FinPaymentMethodModal
        open={finPaymentMethodModalOpen || !!editingFinPaymentMethod}
        method={editingFinPaymentMethod}
        onClose={() => { setFinPaymentMethodModalOpen(false); setEditingFinPaymentMethod(null); }}
        onSaved={(saved) => {
          setFinPaymentMethods(prev => {
            const idx = prev.findIndex(m => m.id === saved.id);
            return idx >= 0 ? prev.map(m => m.id === saved.id ? saved : m) : [...prev, saved];
          });
          setFinPaymentMethodModalOpen(false);
          setEditingFinPaymentMethod(null);
        }}
      />
      <FinPaymentMethodTypeModal
        open={finPaymentMethodTypeModalOpen || !!editingFinPaymentMethodType}
        type={editingFinPaymentMethodType}
        onClose={() => { setFinPaymentMethodTypeModalOpen(false); setEditingFinPaymentMethodType(null); }}
        onSaved={(saved) => {
          setFinPaymentMethodTypes(prev => {
            const idx = prev.findIndex(t => t.id === saved.id);
            return idx >= 0 ? prev.map(t => t.id === saved.id ? saved : t) : [...prev, saved];
          });
          setFinPaymentMethodTypeModalOpen(false);
          setEditingFinPaymentMethodType(null);
        }}
      />
      <DepartmentModal
        open={departmentModalOpen || !!editingDepartment}
        department={editingDepartment}
        onClose={() => { setDepartmentModalOpen(false); setEditingDepartment(null); }}
        onSaved={(saved) => {
          setDepartments(prev => {
            const idx = prev.findIndex(d => d.id === saved.id);
            return idx >= 0 ? prev.map(d => d.id === saved.id ? saved : d) : [...prev, saved];
          });
          setDepartmentModalOpen(false);
          setEditingDepartment(null);
        }}
      />
      <FinAccountModal
        open={finAccountModalOpen || !!editingFinAccount}
        account={editingFinAccount}
        parentAccount={parentFinAccount}
        onClose={() => { setFinAccountModalOpen(false); setEditingFinAccount(null); setParentFinAccount(null); }}
        onSaved={handleFinAccountSaved}
      />
      <FinTitleModal
        open={finTitleModalOpen || !!editingFinTitle}
        title={editingFinTitle}
        defaultType={finTitleDefaultType}
        initialTab={finTitleInitialTab}
        onClose={() => { setFinTitleModalOpen(false); setEditingFinTitle(null); setFinTitleInitialTab("geral"); }}
        onSaved={handleFinTitleSaved}
      />
      <FinTitlesFilterModal
        open={finTitlesFilterOpen}
        filters={finTitlesFilters}
        onClose={() => setFinTitlesFilterOpen(false)}
        onApply={(f) => setFinTitlesFilters(f)}
      />
      <FinCompositionModal
        open={finCompositionModalOpen}
        titles={finCompositionTitles}
        onClose={() => { setFinCompositionModalOpen(false); setFinCompositionTitles([]); }}
        onConfirm={async (titles, quantity, interval, firstDueDate) => {
          await api.post('/fin-titles/compose', {
            title_ids:      titles.map(t => t.id),
            quantity,
            interval,
            first_due_date: firstDueDate,
          });
          const type = titles[0]?.type ?? 'expense';
          if (type === 'expense') {
            setFinTitlesLoading(true);
            api.get<FinTitle[]>('/fin-titles?type=expense').then(res => setFinTitles(res.data)).catch(() => {}).finally(() => setFinTitlesLoading(false));
          } else {
            setFinTitlesIncomeLoading(true);
            api.get<FinTitle[]>('/fin-titles?type=income').then(res => setFinTitlesIncome(res.data)).catch(() => {}).finally(() => setFinTitlesIncomeLoading(false));
          }
        }}
      />
      <PeopleModal
        open={peopleModalOpen || !!editingPerson}
        person={editingPerson}
        typePeople={typePeople}
        typeContacts={typeContacts}
        typeAddresses={typeAddresses}
        typeDocuments={typeDocuments}
        onClose={() => { setPeopleModalOpen(false); setEditingPerson(null); }}
        onSaved={(saved) => {
          setPeople(prev => {
            const idx = prev.findIndex(p => p.id === saved.id);
            return idx >= 0 ? prev.map(p => p.id === saved.id ? saved : p) : [...prev, saved];
          });
          if (!editingPerson) {
            setPeopleModalOpen(false);
          }
        }}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <Toolbar>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex size-8 rounded-lg items-center justify-center shrink-0 bg-[#1D6FE8]">
              <MapPinned className="size-4 text-white" />
            </div>
            <span className="hidden lg:inline text-lg text-foreground"><strong>Mapa</strong>do<strong>Voto</strong></span>
            <ToolbarHeading>
              <div className="flex items-center gap-2">
                {isMaster ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1 text-sm font-medium text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors whitespace-nowrap">
                        Gabinete: {tenantName} <ChevronDown className="size-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {tenants.map(t => (
                        <DropdownMenuItem
                          key={t.id}
                          onClick={() => {
                            const base = getBaseDomain();
                            window.location.href = `${window.location.protocol}//${t.slug}.${base}`;
                          }}
                        >
                          {t.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-sm font-medium text-foreground px-2">
                    Gabinete: {tenantName}
                  </span>
                )}
                <TabsList size="xs">
                  <TabsTrigger value="overview">Mapa</TabsTrigger>
                  <TabsTrigger value="activity">Atendimentos</TabsTrigger>
                  <TabsTrigger value="metrics">Agenda</TabsTrigger>
                  <TabsTrigger value="reports">Alianças</TabsTrigger>
                  <TabsTrigger value="alerts" onClick={() => setFinSection('fin-dashboard')}><DollarSign className="size-3.5" />Finanças</TabsTrigger>
                  <TabsTrigger value="settings" onClick={() => setSettingsSection('settings-dashboard')}><Settings className="size-3.5" />Configurações</TabsTrigger>
                </TabsList>
              </div>
            </ToolbarHeading>
          </div>
          {!isMobile && (
            <ToolbarActions>
              <Navbar />
            </ToolbarActions>
          )}
        </Toolbar>

        {isMaster && (
          <TabsContent value="gabinetes" className="flex-1 min-h-0 mt-0 flex flex-col">
            <AppMegaMenu />
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><Building2 className="size-5 text-muted-foreground" />Gabinetes <Badge variant="success" appearance="light" size="md">{formatRecordCount(tenants.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Configurações', 'Gabinetes']} />
                </div>
                <div className="flex items-center gap-2">
                  {tenantsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({tenantsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Badge variant="success" appearance="light" size="sm">Publicar</Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Badge variant="destructive" appearance="light" size="sm">Ocultar</Badge>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <GabinetesDataGrid tenants={tenants} isLoading={tenantsLoading} onSelectionChange={setTenantsSelected} onEdit={setEditingTenant} />
              </div>
              <PageFooter />
            </div>
          </TabsContent>
        )}

        <TabsContent value="overview" className="flex-1 min-h-0 mt-0 flex flex-col">
          <div className="flex-1 min-h-0 rounded-lg overflow-hidden flex flex-row">
            <div className={isSplit ? "w-1/2 h-full" : "w-full h-full"}>
              <MapaDoVotoMap
                mapRef={mapRef1}
                syncRef={isSplit ? mapRef2 : undefined}
                onCityBoundsReady={setCityBounds}
                cityBounds={cityBounds}
              />
            </div>
            {isSplit && (
              <div className="w-1/2 h-full border-l border-border">
                <MapaDoVotoMap
                  key="map2"
                  mapRef={mapRef2}
                  syncRef={mapRef1}
                  initialView={getMap2InitialView()}
                  cityBounds={cityBounds}
                  isCompare={true}
                />
              </div>
            )}
          </div>
          <PageFooter />
        </TabsContent>

        <TabsContent value="activity" className="flex-1 min-h-0 mt-0">
          <div className="rounded-lg overflow-hidden h-full flex items-center justify-center border border-border">
            <p className="text-muted-foreground">Atendimentos — em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 min-h-0 mt-0">
          <div className="rounded-lg overflow-hidden h-full flex items-center justify-center border border-border">
            <p className="text-muted-foreground">Agenda — em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="flex-1 min-h-0 mt-0">
          <div className="rounded-lg overflow-hidden h-full flex items-center justify-center border border-border">
            <p className="text-muted-foreground">Alianças — em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="pessoas" className="flex-1 min-h-0 mt-0 flex flex-col">
          <AppMegaMenu />
          <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><Users className="size-5" />Pessoas <Badge variant="success" appearance="light" size="md">{formatRecordCount(people.length)}</Badge></h2>
                <SectionBreadcrumb items={['Home', 'Pessoas']} />
              </div>
              <div className="flex items-center gap-2">
                {peopleSelected > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                        Ações em massa ({peopleSelected}) <ChevronDown className="size-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                          <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button variant="outline" size="sm">
                      <Search className="size-4 mr-2" />
                      Pesquisar
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setPeopleModalOpen(true)}>
                      <Plus className="size-4 mr-2" />
                      Novo Registro
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <PeopleDataGrid
                people={people}
                isLoading={peopleLoading}
                onSelectionChange={setPeopleSelected}
                onEdit={(p) => setEditingPerson(p)}
                onDelete={handlePeopleDelete}
              />
            </div>
            <PageFooter />
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="flex-1 min-h-0 mt-0 flex flex-col">
          <FinMegaMenu onNavigate={setFinSection} activeSection={finSection} />

          {finSection === 'fin-dashboard' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><LayoutDashboard className="size-5 text-muted-foreground" />Dashboard Financeiro</h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Dashboard']} />
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Em breve
              </div>
              <PageFooter />
            </div>
          ) : finSection === 'fin-payment-method-types' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><BookmarkCheck className="size-5 text-muted-foreground" />Tipos de Modalidade <Badge variant="success" appearance="light" size="md">{formatRecordCount(finPaymentMethodTypes.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Modalidades', 'Tipos de Modalidade']} />
                </div>
                <div className="flex items-center gap-2">
                  {finPaymentMethodTypesSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({finPaymentMethodTypesSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Excluir selecionados</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Confirmar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setFinPaymentMethodTypeModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinPaymentMethodTypesDataGrid
                  types={finPaymentMethodTypes}
                  isLoading={finPaymentMethodTypesLoading}
                  onSelectionChange={setFinPaymentMethodTypesSelected}
                  onEdit={(t) => setEditingFinPaymentMethodType(t)}
                  onDelete={handleFinPaymentMethodTypeDelete}
                  onReorder={handleFinPaymentMethodTypeReorder}
                />
              </div>
              <PageFooter />
            </div>
          ) : finSection === 'fin-payment-methods' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><CreditCard className="size-5 text-muted-foreground" />Modalidades de Pagamento <Badge variant="success" appearance="light" size="md">{formatRecordCount(finPaymentMethods.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Modalidades', 'Modalidades']} />
                </div>
                <div className="flex items-center gap-2">
                  {finPaymentMethodsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({finPaymentMethodsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setFinPaymentMethodModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinPaymentMethodsDataGrid
                  methods={finPaymentMethods}
                  isLoading={finPaymentMethodsLoading}
                  onSelectionChange={setFinPaymentMethodsSelected}
                  onEdit={(m) => setEditingFinPaymentMethod(m)}
                  onDelete={handleFinPaymentMethodDelete}
                  onReorder={handleFinPaymentMethodReorder}
                />
              </div>
              <PageFooter />
            </div>
          ) : finSection === 'fin-departments' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><Building className="size-5 text-muted-foreground" />Departamentos <Badge variant="success" appearance="light" size="md">{formatRecordCount(departments.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Departamentos']} />
                </div>
                <div className="flex items-center gap-2">
                  {departmentsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({departmentsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setDepartmentModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <DepartmentsDataGrid
                  departments={departments}
                  isLoading={departmentsLoading}
                  onSelectionChange={setDepartmentsSelected}
                  onEdit={(d) => setEditingDepartment(d)}
                  onDelete={handleDepartmentDelete}
                  onReorder={handleDepartmentsReorder}
                />
              </div>
              <PageFooter />
            </div>
          ) : finSection === 'fin-accounts' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><LayoutList className="size-5 text-muted-foreground" />Plano de Contas <Badge variant="success" appearance="light" size="md">{formatRecordCount(finAccounts.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Plano de Contas']} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Search className="size-4 mr-2" />
                    Pesquisar
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => { setParentFinAccount(null); setFinAccountModalOpen(true); }}>
                    <Plus className="size-4 mr-2" />
                    Novo Registro
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <FinAccountsTree
                  accounts={finAccounts}
                  isLoading={finAccountsLoading}
                  onReorder={handleFinAccountsReorder}
                  onAddChild={(parent) => { setParentFinAccount(parent); setEditingFinAccount(null); setFinAccountModalOpen(true); }}
                  onEdit={(acc) => { setEditingFinAccount(acc); setParentFinAccount(null); setFinAccountModalOpen(true); }}
                  onDelete={handleFinAccountDelete}
                />
              </div>
              <PageFooter />
            </div>
          ) : finSection === 'fin-banks' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><Landmark className="size-5 text-muted-foreground" />Bancos <Badge variant="success" appearance="light" size="md">{formatRecordCount(finBanks.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Bancos']} />
                </div>
                <div className="flex items-center gap-2">
                  {finBanksSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({finBanksSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setFinBankModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinBanksDataGrid
                  banks={finBanks}
                  isLoading={finBanksLoading}
                  onSelectionChange={setFinBanksSelected}
                  onEdit={(b) => setEditingFinBank(b)}
                  onDelete={handleFinBankDelete}
                  onReorder={handleFinBankReorder}
                />
              </div>
              <PageFooter />
            </div>
          ) : finSection === 'fin-extract' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5">
                    <ScrollText className="size-5 text-muted-foreground" />
                    Extrato
                    <Badge variant="success" appearance="light" size="md">{formatRecordCount(finExtract.length)}</Badge>
                  </h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Extrato']} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8">
                    <Search className="size-4 mr-2" />
                    Pesquisar
                  </Button>
                  <ExtractViewToggle view={finExtractView} onChange={setFinExtractView} />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinExtractDataGrid entries={finExtract} isLoading={finExtractLoading} view={finExtractView} />
              </div>
              <PageFooter />
            </div>
          ) : finSection === 'fin-titles-income' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5">
                    <BanknoteArrowUp className="size-5" />
                    Títulos a Receber
                    <Badge variant="success" appearance="light" size="md">{formatRecordCount(finTitlesIncome.length)}</Badge>
                  </h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Títulos a Receber']} />
                </div>
                <div className="flex items-center gap-2">
                  {finTitlesIncomeSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({finTitlesIncomeSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {finTitlesIncomeAllPending && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={handleBulkCancelIncome}><Badge variant="destructive" appearance="light" size="sm">Cancelar</Badge></DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        {finTitlesIncomeAllPending && finTitlesIncomeAllSamePeople && (
                          <DropdownMenuItem onClick={() => { setFinCompositionTitles(finTitlesIncomeSelectedItems); setFinCompositionModalOpen(true); }}>
                            Composição
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setFinTitlesFilterType('income'); setFinTitlesFilterOpen(true); }}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => { setFinTitleDefaultType('income'); setFinTitleModalOpen(true); }}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinTitlesDataGrid
                  titles={filteredFinTitlesIncome}
                  isLoading={finTitlesIncomeLoading}
                  onSelectionChange={(count, allPending, ids, allSamePeople, items) => { setFinTitlesIncomeSelected(count); setFinTitlesIncomeAllPending(allPending); setFinTitlesIncomeSelectedIds(ids); setFinTitlesIncomeAllSamePeople(allSamePeople); setFinTitlesIncomeSelectedItems(items); }}
                  onEdit={(t) => { setFinTitleInitialTab("geral"); setEditingFinTitle(t); setFinTitleModalOpen(true); }}
                  onBaixar={(t) => { setFinTitleInitialTab("baixar"); setEditingFinTitle(t); setFinTitleModalOpen(true); }}
                />
              </div>
              <PageFooter />
            </div>
          ) : (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5">
                    <BanknoteArrowDown className="size-5" />
                    Títulos a Pagar
                    <Badge variant="success" appearance="light" size="md">{formatRecordCount(finTitles.length)}</Badge>
                  </h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Títulos a Pagar']} />
                </div>
                <div className="flex items-center gap-2">
                  {finTitlesSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({finTitlesSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {finTitlesAllPending && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={handleBulkCancelExpense}><Badge variant="destructive" appearance="light" size="sm">Cancelar</Badge></DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        {finTitlesAllPending && finTitlesAllSamePeople && (
                          <DropdownMenuItem onClick={() => { setFinCompositionTitles(finTitlesSelectedItems); setFinCompositionModalOpen(true); }}>
                            Composição
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setFinTitlesFilterType('expense'); setFinTitlesFilterOpen(true); }}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => { setFinTitleDefaultType('expense'); setFinTitleModalOpen(true); }}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinTitlesDataGrid
                  titles={filteredFinTitles}
                  isLoading={finTitlesLoading}
                  onSelectionChange={(count, allPending, ids, allSamePeople, items) => { setFinTitlesSelected(count); setFinTitlesAllPending(allPending); setFinTitlesSelectedIds(ids); setFinTitlesAllSamePeople(allSamePeople); setFinTitlesSelectedItems(items); }}
                  onEdit={(t) => { setFinTitleInitialTab("geral"); setEditingFinTitle(t); setFinTitleModalOpen(true); }}
                  onBaixar={(t) => { setFinTitleInitialTab("baixar"); setEditingFinTitle(t); setFinTitleModalOpen(true); }}
                />
              </div>
              <PageFooter />
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="flex-1 min-h-0 mt-0 flex flex-col">
          <AppMegaMenu onNavigate={setSettingsSection} activeSection={settingsSection} />
          {settingsSection === 'settings-dashboard' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><Settings className="size-5 text-muted-foreground" />Dashboard de Configurações</h2>
                  <SectionBreadcrumb items={['Home', 'Configurações', 'Dashboard']} />
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Em breve
              </div>
              <PageFooter />
            </div>
          ) : settingsSection === 'type-people' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><BookmarkCheck className="size-5" />Tipo de Pessoas <Badge variant="success" appearance="light" size="md">{formatRecordCount(typePeople.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Cadastros', 'Pessoas', 'Tipo de Pessoas']} />
                </div>
                <div className="flex items-center gap-2">
                  {typePeopleSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({typePeopleSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypePeopleModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <TypePeopleDataGrid
                  typePeople={typePeople}
                  isLoading={typePeopleLoading}
                  onSelectionChange={setTypePeopleSelected}
                  onEdit={(tp) => setEditingTypePeople(tp)}
                  onDelete={handleTypePeopleDelete}
                  onReorder={handleTypePeopleReorder}
                />
              </div>
              <PageFooter />
            </div>
          ) : settingsSection === 'type-contact' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><BookmarkCheck className="size-5" />Tipo de Contato <Badge variant="success" appearance="light" size="md">{formatRecordCount(typeContacts.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Cadastros', 'Submódulos', 'Contatos', 'Tipo de Contato']} />
                </div>
                <div className="flex items-center gap-2">
                  {typeContactsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({typeContactsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypeContactsModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <TypeContactsDataGrid
                  typeContacts={typeContacts}
                  isLoading={typeContactsLoading}
                  onSelectionChange={setTypeContactsSelected}
                  onEdit={(tc) => setEditingTypeContact(tc)}
                  onDelete={handleTypeContactsDelete}
                  onReorder={handleTypeContactsReorder}
                />
              </div>
              <PageFooter />
            </div>
          ) : settingsSection === 'type-address' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><BookmarkCheck className="size-5" />Tipo de Endereço <Badge variant="success" appearance="light" size="md">{formatRecordCount(typeAddresses.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Cadastros', 'Submódulos', 'Endereços', 'Tipo de Endereço']} />
                </div>
                <div className="flex items-center gap-2">
                  {typeAddressesSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({typeAddressesSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypeAddressesModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <TypeAddressesDataGrid
                  typeAddresses={typeAddresses}
                  isLoading={typeAddressesLoading}
                  onSelectionChange={setTypeAddressesSelected}
                  onEdit={(ta) => setEditingTypeAddress(ta)}
                  onDelete={handleTypeAddressesDelete}
                  onReorder={handleTypeAddressesReorder}
                />
              </div>
              <PageFooter />
            </div>
          ) : settingsSection === 'type-document' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><BookmarkCheck className="size-5" />Tipo de Documentos <Badge variant="success" appearance="light" size="md">{formatRecordCount(typeDocuments.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Cadastros', 'Submódulos', 'Documentos', 'Tipo de Documentos']} />
                </div>
                <div className="flex items-center gap-2">
                  {typeDocumentsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({typeDocumentsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypeDocumentsModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <TypeDocumentsDataGrid
                  typeDocuments={typeDocuments}
                  isLoading={typeDocumentsLoading}
                  onSelectionChange={setTypeDocumentsSelected}
                  onEdit={(td) => setEditingTypeDocument(td)}
                  onDelete={handleTypeDocumentsDelete}
                  onReorder={handleTypeDocumentsReorder}
                />
              </div>
              <PageFooter />
            </div>
          ) : settingsSection === 'pessoas' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><Users className="size-5" />Pessoas <Badge variant="success" appearance="light" size="md">{formatRecordCount(people.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Configurações', 'Pessoas']} />
                </div>
                <div className="flex items-center gap-2">
                  {peopleSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({peopleSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setPeopleModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <PeopleDataGrid
                  people={people}
                  isLoading={peopleLoading}
                  onSelectionChange={setPeopleSelected}
                  onEdit={(p) => setEditingPerson(p)}
                  onDelete={handlePeopleDelete}
                />
              </div>
              <PageFooter />
            </div>
          ) : settingsSection === 'gabinetes' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><Building2 className="size-5 text-muted-foreground" />Gabinetes <Badge variant="success" appearance="light" size="md">{formatRecordCount(tenants.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Configurações', 'Gabinetes']} />
                </div>
                <div className="flex items-center gap-2">
                  {tenantsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({tenantsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Badge variant="success" appearance="light" size="sm">Publicar</Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Badge variant="destructive" appearance="light" size="sm">Ocultar</Badge>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <GabinetesDataGrid tenants={tenants} isLoading={tenantsLoading} onSelectionChange={setTenantsSelected} onEdit={setEditingTenant} />
              </div>
              <PageFooter />
            </div>
          ) : settingsSection === 'permission-actions' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><ShieldCheck className="size-5" />Permissões <Badge variant="success" appearance="light" size="md">{formatRecordCount(permissionActions.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Cadastros', 'Permissões']} />
                </div>
                <div className="flex items-center gap-2">
                  {permissionActionsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({permissionActionsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Excluir selecionados</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Confirmar exclusão</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setPermissionActionsModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <PermissionActionsDataGrid
                  permissionActions={permissionActions}
                  isLoading={permissionActionsLoading}
                  onEdit={(pa) => setEditingPermissionAction(pa)}
                  onDelete={handlePermissionActionDelete}
                  onAddToModule={(module) => { setEditingPermissionAction({ id: 0, module, action: '', description: null }); }}
                />
              </div>
              <PageFooter />
            </div>
          ) : (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden flex items-center justify-center border border-border">
              <p className="text-muted-foreground">Configurações — em breve</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
