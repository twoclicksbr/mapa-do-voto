import { useRef, useState, useEffect, useMemo, Fragment } from "react";
import * as L from "leaflet";
import { LoginModal } from "@/components/auth/login-modal";
import { useLayout } from "@/components/layouts/layout-33/components/context";
import { Toolbar, ToolbarHeading, ToolbarActions } from "@/components/layouts/layout-33/components/toolbar";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, Plus, MapPin, MapPinned, Building, Building2, Settings, Users, ShieldCheck, BookmarkCheck, Home, NotepadText, ReplaceAll, FileText, Phone, Landmark, CreditCard, DollarSign, LayoutList, LayoutDashboard, BanknoteArrowDown, BanknoteArrowUp, ScrollText, CalendarDays, Wallet, X, type LucideIcon } from "lucide-react";
import { useActiveCandidate } from "@/components/map/active-candidate-context";
import { MapaDoVotoMap } from "@/components/map/mapa-do-voto-map";
import { Navbar } from "@/components/layouts/layout-33/components/navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { GabinetesFilterModal, GabinetesFilters } from "@/components/gabinetes/gabinetes-filter-modal";
import { AppMegaMenu } from "@/components/common/app-mega-menu";
import { TypePeopleDataGrid, TypePeople } from "@/components/type-people/type-people-data-grid";
import { TypePeopleModal } from "@/components/type-people/type-people-modal";
import { TypePeopleFilterModal, TypePeopleFilters } from "@/components/type-people/type-people-filter-modal";
import { TypeContactsDataGrid, TypeContact } from "@/components/type-contacts/type-contacts-data-grid";
import { TypeContactsModal } from "@/components/type-contacts/type-contacts-modal";
import { TypeContactsFilterModal, TypeContactsFilters } from "@/components/type-contacts/type-contacts-filter-modal";
import { TypeAddressesDataGrid, TypeAddress } from "@/components/type-addresses/type-addresses-data-grid";
import { TypeAddressesModal } from "@/components/type-addresses/type-addresses-modal";
import { TypeAddressesFilterModal, TypeAddressesFilters } from "@/components/type-addresses/type-addresses-filter-modal";
import { TypeDocumentsDataGrid, TypeDocument } from "@/components/type-documents/type-documents-data-grid";
import { TypeDocumentsModal } from "@/components/type-documents/type-documents-modal";
import { TypeDocumentsFilterModal, TypeDocumentsFilters } from "@/components/type-documents/type-documents-filter-modal";
import { PeopleDataGrid, Person } from "@/components/people/people-data-grid";
import { PeopleModal } from "@/components/people/people-modal";
import { PeopleFilterModal, PeopleFilters } from "@/components/people/people-filter-modal";
import { PermissionActionsDataGrid, PermissionAction } from "@/components/permission-actions/permission-actions-data-grid";
import { PermissionActionsModal } from "@/components/permission-actions/permission-actions-modal";
import { PermissionActionsFilterModal, PermissionActionsFilters } from "@/components/permission-actions/permission-actions-filter-modal";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { FinTitlesDataGrid, FinTitle } from "@/components/financeiro/fin-titles-data-grid";
import { FinCompositionModal } from "@/components/financeiro/fin-composition-modal";
import { FinBanksDataGrid, FinBank } from "@/components/financeiro/fin-banks-data-grid";
import { FinBankModal } from "@/components/financeiro/fin-bank-modal";
import { FinBanksFilterModal, FinBanksFilters } from "@/components/financeiro/fin-banks-filter-modal";
import { FinPaymentMethodsDataGrid, FinPaymentMethod } from "@/components/financeiro/fin-payment-methods-data-grid";
import { FinPaymentMethodModal } from "@/components/financeiro/fin-payment-method-modal";
import { FinPaymentMethodsFilterModal, FinPaymentMethodsFilters } from "@/components/financeiro/fin-payment-methods-filter-modal";
import { FinPaymentMethodTypesDataGrid, FinPaymentMethodType } from "@/components/financeiro/fin-payment-method-types-data-grid";
import { FinPaymentMethodTypeModal } from "@/components/financeiro/fin-payment-method-type-modal";
import { FinPaymentMethodTypesFilterModal, FinPaymentMethodTypesFilters } from "@/components/financeiro/fin-payment-method-types-filter-modal";
import { FinMegaMenu } from "@/components/financeiro/fin-mega-menu";
import { DepartmentsDataGrid, Department } from "@/components/financeiro/departments-data-grid";
import { DepartmentModal } from "@/components/financeiro/department-modal";
import { DepartmentsFilterModal, DepartmentsFilters } from "@/components/financeiro/departments-filter-modal";
import { FinAccountsTree, FinAccount, ReorderItem } from "@/components/financeiro/fin-accounts-tree";
import { FinAccountModal } from "@/components/financeiro/fin-account-modal";
import { FinAccountsFilterModal, FinAccountsFilters } from "@/components/financeiro/fin-accounts-filter-modal";
import { FinTitleModal } from "@/components/financeiro/fin-title-modal";
import { FinTitlesFilterModal, FinTitlesFilters } from "@/components/financeiro/fin-titles-filter-modal";
import { formatDateValue, type DateSelectorValue } from "@/components/reui/date-selector";
import { FinExtractDataGrid, FinExtractEntry, ExtractViewToggle, ExtractView, EXTRACT_VIEW_KEY } from "@/components/financeiro/fin-extract-data-grid";
import { FinExtractFilterModal, FinExtractFilters } from "@/components/financeiro/fin-extract-filter-modal";
import { FinExtractModal } from "@/components/financeiro/fin-extract-modal";
import { FinWalletTab } from "@/components/financeiro/fin-wallet-tab";
import { PageFooter } from "@/components/common/page-footer";
import { AgendaTab } from "@/components/agenda/agenda-tab";
import { EventTypesDataGrid, EventType } from "@/components/event-types/event-types-data-grid";
import { EventTypesModal } from "@/components/event-types/event-types-modal";
import { EventTypesFilterModal, EventTypesFilters } from "@/components/event-types/event-types-filter-modal";

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
  'Agenda': CalendarDays,
  'Tipos de Evento': BookmarkCheck,
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
  const [gabinetesFilterOpen, setGabinetesFilterOpen] = useState(false);
  const [gabinetesFilters, setGabinetesFilters] = useState<GabinetesFilters>({});
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
  const [typePeopleFilterOpen, setTypePeopleFilterOpen] = useState(false);
  const [typePeopleFilters, setTypePeopleFilters] = useState<TypePeopleFilters>({});

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(false);
  const [eventTypesSelected, setEventTypesSelected] = useState(0);
  const [eventTypesModalOpen, setEventTypesModalOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [eventTypesFilterOpen, setEventTypesFilterOpen] = useState(false);
  const [eventTypesFilters, setEventTypesFilters] = useState<EventTypesFilters>({});

  const [typeContacts, setTypeContacts] = useState<TypeContact[]>([]);
  const [typeContactsLoading, setTypeContactsLoading] = useState(false);
  const [typeContactsSelected, setTypeContactsSelected] = useState(0);
  const [typeContactsModalOpen, setTypeContactsModalOpen] = useState(false);
  const [editingTypeContact, setEditingTypeContact] = useState<TypeContact | null>(null);
  const [typeContactsFilterOpen, setTypeContactsFilterOpen] = useState(false);
  const [typeContactsFilters, setTypeContactsFilters] = useState<TypeContactsFilters>({});

  const [typeAddresses, setTypeAddresses] = useState<TypeAddress[]>([]);
  const [typeAddressesLoading, setTypeAddressesLoading] = useState(false);
  const [typeAddressesSelected, setTypeAddressesSelected] = useState(0);
  const [typeAddressesModalOpen, setTypeAddressesModalOpen] = useState(false);
  const [editingTypeAddress, setEditingTypeAddress] = useState<TypeAddress | null>(null);
  const [typeAddressesFilterOpen, setTypeAddressesFilterOpen] = useState(false);
  const [typeAddressesFilters, setTypeAddressesFilters] = useState<TypeAddressesFilters>({});

  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([]);
  const [typeDocumentsLoading, setTypeDocumentsLoading] = useState(false);
  const [typeDocumentsSelected, setTypeDocumentsSelected] = useState(0);
  const [typeDocumentsModalOpen, setTypeDocumentsModalOpen] = useState(false);
  const [editingTypeDocument, setEditingTypeDocument] = useState<TypeDocument | null>(null);
  const [typeDocumentsFilterOpen, setTypeDocumentsFilterOpen] = useState(false);
  const [typeDocumentsFilters, setTypeDocumentsFilters] = useState<TypeDocumentsFilters>({});

  const [permissionActions, setPermissionActions] = useState<PermissionAction[]>([]);
  const [permissionActionsLoading, setPermissionActionsLoading] = useState(false);
  const [permissionActionsSelected, setPermissionActionsSelected] = useState(0);
  const [permissionActionsModalOpen, setPermissionActionsModalOpen] = useState(false);
  const [editingPermissionAction, setEditingPermissionAction] = useState<PermissionAction | null>(null);
  const [permissionActionsFilterOpen, setPermissionActionsFilterOpen] = useState(false);
  const [permissionActionsFilters, setPermissionActionsFilters] = useState<PermissionActionsFilters>({});

  const [people, setPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleSelected, setPeopleSelected] = useState(0);
  const [peopleModalOpen, setPeopleModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [peopleFilterOpen, setPeopleFilterOpen] = useState(false);
  const [peopleFilters, setPeopleFilters] = useState<PeopleFilters>({});

  const matchesDateFilter = (dDay: Date, v: DateSelectorValue): boolean => {
    if (v.period === "day") {
      if (v.operator === "is"      && v.startDate && dDay.toDateString() !== v.startDate.toDateString()) return false;
      if (v.operator === "before"  && v.startDate && dDay >= v.startDate)                                return false;
      if (v.operator === "after"   && v.startDate && dDay <= v.startDate)                                return false;
      if (v.operator === "between" && v.startDate && v.endDate  && (dDay < v.startDate || dDay > v.endDate))        return false;
      if (v.operator === "between" && v.startDate && !v.endDate && dDay.toDateString() !== v.startDate.toDateString()) return false;
      return true;
    }
    const getPStart = (yr: number, val: number): Date => {
      if (v.period === "month")     return new Date(yr, val, 1);
      if (v.period === "quarter")   return new Date(yr, val * 3, 1);
      if (v.period === "half-year") return new Date(yr, val * 6, 1);
      return new Date(yr, 0, 1);
    };
    const getPEnd = (yr: number, val: number): Date => {
      if (v.period === "month")     return new Date(yr, val + 1, 0);
      if (v.period === "quarter")   return new Date(yr, val * 3 + 3, 0);
      if (v.period === "half-year") return new Date(yr, val * 6 + 6, 0);
      return new Date(yr, 11, 31);
    };
    if (v.operator === "between" && v.rangeStart && v.rangeEnd) {
      const pStart = getPStart(v.rangeStart.year, v.rangeStart.value);
      const pEnd   = getPEnd(v.rangeEnd.year, v.rangeEnd.value);
      if (dDay < pStart || dDay > pEnd) return false;
      return true;
    }
    const yr  = v.year ?? new Date().getFullYear();
    const val = v.period === "month"     ? (v.month    ?? 0)
              : v.period === "quarter"   ? (v.quarter  ?? 0)
              : v.period === "half-year" ? (v.halfYear ?? 0)
              : 0;
    const pStart = getPStart(yr, val);
    const pEnd   = getPEnd(yr, val);
    if (v.operator === "is"     && (dDay < pStart || dDay > pEnd)) return false;
    if (v.operator === "before" && dDay >= pStart)                   return false;
    if (v.operator === "after"  && dDay <= pEnd)                     return false;
    return true;
  };

  const applyPeopleFilters = (list: Person[], f: PeopleFilters) => list.filter((p) => {
    if (f.filterId     && !String(p.id).includes(f.filterId))                   return false;
    if (f.peopleId     && p.id             !== f.peopleId)                      return false;
    if (f.typePeopleIds?.length && !f.typePeopleIds.includes(p.type_people_id!)) return false;
    if (f.status?.length) {
      const wantActive   = f.status.includes("active");
      const wantInactive = f.status.includes("inactive");
      if (wantActive && !wantInactive && !p.active)  return false;
      if (!wantActive && wantInactive && p.active)   return false;
    }
    if (f.dateValue && f.dateField) {
      const raw = (p as Record<string, unknown>)[f.dateField] as string | null;
      if (raw) {
        const d = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
        const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (!matchesDateFilter(dDay, f.dateValue)) return false;
      }
    }
    if (f.birthDateValue) {
      const raw = p.birth_date;
      if (!raw) return false;
      const bd = new Date(raw + "T00:00:00");
      const v  = f.birthDateValue;
      // Compara apenas mês e dia — normaliza o aniversário para o ano do filtro
      const norm = (ref: Date) => new Date(ref.getFullYear(), bd.getMonth(), bd.getDate());
      if (v.operator === "is"      && v.startDate) { const n = norm(v.startDate); if (n.toDateString() !== v.startDate.toDateString())     return false; }
      if (v.operator === "before"  && v.startDate) { const n = norm(v.startDate); if (n >= v.startDate)                                    return false; }
      if (v.operator === "after"   && v.startDate) { const n = norm(v.startDate); if (n <= v.startDate)                                    return false; }
      if (v.operator === "between" && v.startDate && v.endDate) { const n = norm(v.startDate); if (n < v.startDate || n > v.endDate)       return false; }
    }
    if (f.contactTypeId || f.contactValue) {
      const contacts = p.contacts ?? [];
      const match = contacts.some((c) => {
        if (f.contactTypeId && c.type_contact_id !== f.contactTypeId) return false;
        if (f.contactValue) {
          const q  = f.contactValue.toLowerCase();
          const v  = c.value.toLowerCase();
          const qd = q.replace(/\D/g, "");
          const vd = v.replace(/\D/g, "");
          if (!v.includes(q) && !(qd && vd.includes(qd))) return false;
        }
        return true;
      });
      if (!match) return false;
    }
    if (f.docTypeId || f.docValue) {
      const docs = p.documents ?? [];
      const match = docs.some((d) => {
        if (f.docTypeId && d.type_document_id !== f.docTypeId) return false;
        if (f.docValue) {
          const q  = f.docValue.toLowerCase();
          const v  = d.value.toLowerCase();
          const qd = q.replace(/\D/g, "");
          const vd = v.replace(/\D/g, "");
          if (!v.includes(q) && !(qd && vd.includes(qd))) return false;
        }
        return true;
      });
      if (!match) return false;
    }
    if (f.addrTypeId || f.addrValue) {
      const addrs = p.addresses ?? [];
      const match = addrs.some((a) => {
        if (f.addrTypeId && a.type_address_id !== f.addrTypeId) return false;
        if (f.addrValue) {
          const q = f.addrValue.toLowerCase();
          const haystack = [a.logradouro, a.numero, a.bairro, a.cidade, a.uf, a.cep]
            .filter(Boolean).join(" ").toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });
      if (!match) return false;
    }
    return true;
  });

  const filteredPeople = useMemo(() => applyPeopleFilters(people, peopleFilters), [people, peopleFilters]);

  const countPeopleFilters = (f: PeopleFilters) =>
    [f.filterId, f.peopleId, f.typePeopleIds?.length, f.status?.length, f.dateValue, f.birthDateValue, f.contactTypeId, f.contactValue, f.docTypeId, f.docValue, f.addrTypeId, f.addrValue].filter(Boolean).length;

  const PEOPLE_STATUS_LABELS: Record<string, string> = { active: "Ativo", inactive: "Inativo" };

  const getPeopleFilterChips = (f: PeopleFilters, setF: (v: PeopleFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)        chips.push({ key: 'id',         label: `ID: ${f.filterId}`,                                                                                              onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.peopleName)      chips.push({ key: 'people',     label: `Pessoa: ${f.peopleName}`,                                                                                        onRemove: () => setF({ ...f, peopleId: undefined, peopleName: undefined }) });
    f.typePeopleIds?.forEach(id => chips.push({ key: `type_${id}`, label: `Tipo: ${typePeople.find(t => t.id === id)?.name ?? id}`,                                              onRemove: () => setF({ ...f, typePeopleIds: f.typePeopleIds!.filter(x => x !== id) }) }));
    f.status?.forEach(s  => chips.push({ key: `status_${s}`, label: `Status: ${PEOPLE_STATUS_LABELS[s] ?? s}`,                                                                      onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${({ created_at: "Criado em", updated_at: "Editado em", deleted_at: "Deletado em" })[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    if (f.birthDateValue)  chips.push({ key: 'birthDate',  label: `Aniversário: ${formatDateValue(f.birthDateValue, undefined, "dd/MM/yyyy")}`,                                     onRemove: () => setF({ ...f, birthDateValue: undefined }) });
    if (f.contactTypeId || f.contactValue) {
      const typePart  = f.contactTypeName ? `${f.contactTypeName}` : "Contato";
      const displayValue = f.contactValue ? f.contactValue.replace(/^\+/, "") : "";
      const valuePart = displayValue ? `: ${displayValue}` : "";
      chips.push({ key: 'contact', label: `${typePart}${valuePart}`, onRemove: () => setF({ ...f, contactTypeId: undefined, contactTypeName: undefined, contactValue: undefined }) });
    }
    if (f.docTypeId || f.docValue) {
      const typePart  = f.docTypeName ? `${f.docTypeName}` : "Documento";
      const valuePart = f.docValue ? `: ${f.docValue}` : "";
      chips.push({ key: 'doc', label: `${typePart}${valuePart}`, onRemove: () => setF({ ...f, docTypeId: undefined, docTypeName: undefined, docValue: undefined }) });
    }
    if (f.addrTypeId || f.addrValue) {
      const typePart  = f.addrTypeName ? `${f.addrTypeName}` : "Endereço";
      const valuePart = f.addrValue ? `: ${f.addrValue}` : "";
      chips.push({ key: 'addr', label: `${typePart}${valuePart}`, onRemove: () => setF({ ...f, addrTypeId: undefined, addrTypeName: undefined, addrValue: undefined }) });
    }
    return chips;
  };

  const applyTypeContactsFilters = (list: TypeContact[], f: TypeContactsFilters) => list.filter((tc) => {
    if (f.filterId   && !String(tc.id).includes(f.filterId))                        return false;
    if (f.filterName && !tc.name.toLowerCase().includes(f.filterName.toLowerCase())) return false;
    if (f.status?.length) {
      const wantActive   = f.status.includes("active");
      const wantInactive = f.status.includes("inactive");
      if (wantActive && !wantInactive && !tc.active)  return false;
      if (!wantActive && wantInactive && tc.active)   return false;
    }
    if (f.dateValue && f.dateField) {
      const raw = (tc as Record<string, unknown>)[f.dateField] as string | null;
      if (raw) {
        const d = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
        const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (!matchesDateFilter(dDay, f.dateValue)) return false;
      }
    }
    return true;
  });

  const filteredTypeContacts = useMemo(() => applyTypeContactsFilters(typeContacts, typeContactsFilters), [typeContacts, typeContactsFilters]);

  const countTypeContactsFilters = (f: TypeContactsFilters) =>
    [f.filterId, f.filterName, f.status?.length, f.dateValue].filter(Boolean).length;

  const getTypeContactsFilterChips = (f: TypeContactsFilters, setF: (v: TypeContactsFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)   chips.push({ key: 'id',   label: `ID: ${f.filterId}`,          onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.filterName) chips.push({ key: 'name', label: `Nome: ${f.filterName}`,      onRemove: () => setF({ ...f, filterName: undefined }) });
    f.status?.forEach(s => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Ativo" : "Inativo"}`, onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${({ created_at: "Criado em", updated_at: "Editado em" })[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
  };

  const applyTypeAddressesFilters = (list: TypeAddress[], f: TypeAddressesFilters) => list.filter((ta) => {
    if (f.filterId   && !String(ta.id).includes(f.filterId))                        return false;
    if (f.filterName && !ta.name.toLowerCase().includes(f.filterName.toLowerCase())) return false;
    if (f.status?.length) {
      const wantActive   = f.status.includes("active");
      const wantInactive = f.status.includes("inactive");
      if (wantActive && !wantInactive && !ta.active)  return false;
      if (!wantActive && wantInactive && ta.active)   return false;
    }
    if (f.dateValue && f.dateField) {
      const raw = (ta as Record<string, unknown>)[f.dateField] as string | null;
      if (raw) {
        const d = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
        const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (!matchesDateFilter(dDay, f.dateValue)) return false;
      }
    }
    return true;
  });

  const filteredTypeAddresses = useMemo(() => applyTypeAddressesFilters(typeAddresses, typeAddressesFilters), [typeAddresses, typeAddressesFilters]);

  const countTypeAddressesFilters = (f: TypeAddressesFilters) =>
    [f.filterId, f.filterName, f.status?.length, f.dateValue].filter(Boolean).length;

  const getTypeAddressesFilterChips = (f: TypeAddressesFilters, setF: (v: TypeAddressesFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)   chips.push({ key: 'id',   label: `ID: ${f.filterId}`,     onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.filterName) chips.push({ key: 'name', label: `Nome: ${f.filterName}`, onRemove: () => setF({ ...f, filterName: undefined }) });
    f.status?.forEach(s => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Ativo" : "Inativo"}`, onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${({ created_at: "Criado em", updated_at: "Editado em" })[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
  };

  const applyGabinetesFilters = (list: Tenant[], f: GabinetesFilters) => list.filter((t) => {
    if (f.filterId   && !String(t.id).includes(f.filterId))                       return false;
    if (f.filterName && !t.name.toLowerCase().includes(f.filterName.toLowerCase())) return false;
    if (f.filterSlug && !t.slug.toLowerCase().includes(f.filterSlug.toLowerCase())) return false;
    if (f.status?.length) {
      const wantActive   = f.status.includes("active");
      const wantInactive = f.status.includes("inactive");
      if (wantActive && !wantInactive && !t.active)  return false;
      if (!wantActive && wantInactive && t.active)   return false;
    }
    if (f.validityValue) {
      const d = new Date(t.valid_until + "T00:00:00");
      const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (!matchesDateFilter(dDay, f.validityValue)) return false;
    }
    return true;
  });

  const filteredTenants = useMemo(() => applyGabinetesFilters(tenants, gabinetesFilters), [tenants, gabinetesFilters]);

  const countGabinetesFilters = (f: GabinetesFilters) =>
    [f.filterId, f.filterName, f.filterSlug, f.status?.length, f.validityValue].filter(Boolean).length;

  const getGabinetesFilterChips = (f: GabinetesFilters, setF: (v: GabinetesFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)    chips.push({ key: 'id',       label: `ID: ${f.filterId}`,              onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.filterName)  chips.push({ key: 'name',     label: `Nome: ${f.filterName}`,          onRemove: () => setF({ ...f, filterName: undefined }) });
    if (f.filterSlug)  chips.push({ key: 'slug',     label: `Subdomínio: ${f.filterSlug}`,    onRemove: () => setF({ ...f, filterSlug: undefined }) });
    f.status?.forEach(s => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Público" : "Oculto"}`, onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.validityValue) chips.push({ key: 'validity', label: `Validade: ${formatDateValue(f.validityValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, validityValue: undefined }) });
    return chips;
  };

  const applyPermissionActionsFilters = (list: PermissionAction[], f: PermissionActionsFilters) => list.filter((pa) => {
    if (f.module && pa.module !== f.module) return false;
    if (f.filterAction) {
      const q = f.filterAction.toLowerCase();
      const inAction     = pa.action?.toLowerCase().includes(q);
      const inNameAction = pa.name_action?.toLowerCase().includes(q);
      if (!inAction && !inNameAction) return false;
    }
    if (f.dateValue && f.dateField) {
      const raw = (pa as Record<string, unknown>)[f.dateField] as string | null;
      if (!raw) return false;
      const dDay = new Date(raw); dDay.setHours(0, 0, 0, 0);
      if (!matchesDateFilter(dDay, f.dateValue)) return false;
    }
    return true;
  });

  const filteredPermissionActions = useMemo(() => applyPermissionActionsFilters(permissionActions, permissionActionsFilters), [permissionActions, permissionActionsFilters]);

  const permissionActionsModules = useMemo(() => {
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    for (const pa of permissionActions) {
      if (!seen.has(pa.module)) {
        seen.add(pa.module);
        result.push({ value: pa.module, label: pa.name_module ?? pa.module });
      }
    }
    return result;
  }, [permissionActions]);

  const countPermissionActionsFilters = (f: PermissionActionsFilters) =>
    [f.module, f.filterAction, f.dateValue].filter(Boolean).length;

  const getPermissionActionsFilterChips = (f: PermissionActionsFilters, setF: (v: PermissionActionsFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.module)       chips.push({ key: 'module', label: `Módulo: ${permissionActionsModules.find(m => m.value === f.module)?.label ?? f.module}`, onRemove: () => setF({ ...f, module: undefined }) });
    if (f.filterAction) chips.push({ key: 'action', label: `Ação: ${f.filterAction}`,                                                                  onRemove: () => setF({ ...f, filterAction: undefined }) });
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${{ created_at: "Criado em", updated_at: "Editado em" }[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
  };

  const applyTypeDocumentsFilters = (list: TypeDocument[], f: TypeDocumentsFilters) => list.filter((td) => {
    if (f.filterId   && !String(td.id).includes(f.filterId))                        return false;
    if (f.filterName && !td.name.toLowerCase().includes(f.filterName.toLowerCase())) return false;
    if (f.validity === "yes" && !td.validity)  return false;
    if (f.validity === "no"  && td.validity)   return false;
    if (f.status?.length) {
      const wantActive   = f.status.includes("active");
      const wantInactive = f.status.includes("inactive");
      if (wantActive && !wantInactive && !td.active)  return false;
      if (!wantActive && wantInactive && td.active)   return false;
    }
    if (f.dateValue && f.dateField) {
      const raw = (td as Record<string, unknown>)[f.dateField] as string | null;
      if (raw) {
        const d = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
        const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (!matchesDateFilter(dDay, f.dateValue)) return false;
      }
    }
    return true;
  });

  const filteredTypeDocuments = useMemo(() => applyTypeDocumentsFilters(typeDocuments, typeDocumentsFilters), [typeDocuments, typeDocumentsFilters]);

  const countTypeDocumentsFilters = (f: TypeDocumentsFilters) =>
    [f.filterId, f.filterName, f.validity, f.status?.length, f.dateValue].filter(Boolean).length;

  const getTypeDocumentsFilterChips = (f: TypeDocumentsFilters, setF: (v: TypeDocumentsFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)   chips.push({ key: 'id',       label: `ID: ${f.filterId}`,                                         onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.filterName) chips.push({ key: 'name',     label: `Nome: ${f.filterName}`,                                     onRemove: () => setF({ ...f, filterName: undefined }) });
    if (f.validity)   chips.push({ key: 'validity', label: `Validade: ${f.validity === "yes" ? "Sim" : "Não"}`,         onRemove: () => setF({ ...f, validity: undefined }) });
    f.status?.forEach(s => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Ativo" : "Inativo"}`,  onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${({ created_at: "Criado em", updated_at: "Editado em" })[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
  };

  const applyEventTypesFilters = (list: EventType[], f: EventTypesFilters) => list.filter((et) => {
    if (f.filterId   && !String(et.id).includes(f.filterId))                        return false;
    if (f.filterName && !et.name.toLowerCase().includes(f.filterName.toLowerCase())) return false;
    if (f.color      && et.color !== f.color)                                        return false;
    if (f.status?.length) {
      const wantActive   = f.status.includes("active");
      const wantInactive = f.status.includes("inactive");
      if (wantActive && !wantInactive && !et.active)  return false;
      if (!wantActive && wantInactive && et.active)   return false;
    }
    if (f.dateValue && f.dateField) {
      const raw = (et as Record<string, unknown>)[f.dateField] as string | null;
      if (raw) {
        const d = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
        const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (!matchesDateFilter(dDay, f.dateValue)) return false;
      }
    }
    return true;
  });

  const filteredEventTypes = useMemo(() => applyEventTypesFilters(eventTypes, eventTypesFilters), [eventTypes, eventTypesFilters]);

  const countEventTypesFilters = (f: EventTypesFilters) =>
    [f.filterId, f.filterName, f.color, f.status?.length, f.dateValue].filter(Boolean).length;

  const getEventTypesFilterChips = (f: EventTypesFilters, setF: (v: EventTypesFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)   chips.push({ key: 'id',    label: `ID: ${f.filterId}`,          onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.filterName) chips.push({ key: 'name',  label: `Nome: ${f.filterName}`,      onRemove: () => setF({ ...f, filterName: undefined }) });
    if (f.color)      chips.push({ key: 'color', label: `Cor: ${eventTypes.find(et => et.color === f.color)?.name ?? f.color}`, onRemove: () => setF({ ...f, color: undefined }) });
    f.status?.forEach(s => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Ativo" : "Inativo"}`, onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${({ created_at: "Criado em", updated_at: "Editado em" })[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
  };

  const applyTypePeopleFilters = (list: TypePeople[], f: TypePeopleFilters) => list.filter((tp) => {
    if (f.filterId   && !String(tp.id).includes(f.filterId))                   return false;
    if (f.filterName && !tp.name.toLowerCase().includes(f.filterName.toLowerCase())) return false;
    if (f.status?.length) {
      const wantActive   = f.status.includes("active");
      const wantInactive = f.status.includes("inactive");
      if (wantActive && !wantInactive && !tp.active)  return false;
      if (!wantActive && wantInactive && tp.active)   return false;
    }
    if (f.dateValue && f.dateField) {
      const raw = (tp as Record<string, unknown>)[f.dateField] as string | null;
      if (raw) {
        const d = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
        const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (!matchesDateFilter(dDay, f.dateValue)) return false;
      }
    }
    return true;
  });

  const filteredTypePeople = useMemo(() => applyTypePeopleFilters(typePeople, typePeopleFilters), [typePeople, typePeopleFilters]);

  const countTypePeopleFilters = (f: TypePeopleFilters) =>
    [f.filterId, f.filterName, f.status?.length, f.dateValue].filter(Boolean).length;

  const getTypePeopleFilterChips = (f: TypePeopleFilters, setF: (v: TypePeopleFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)   chips.push({ key: 'id',   label: `ID: ${f.filterId}`,          onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.filterName) chips.push({ key: 'name', label: `Nome: ${f.filterName}`,      onRemove: () => setF({ ...f, filterName: undefined }) });
    f.status?.forEach(s => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Ativo" : "Inativo"}`, onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${({ created_at: "Criado em", updated_at: "Editado em" })[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
  };

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
  const [finTitlesClearKey, setFinTitlesClearKey] = useState(0);
  const [finTitlesIncomeClearKey, setFinTitlesIncomeClearKey] = useState(0);
  const [finTitlesFilterOpen, setFinTitlesFilterOpen] = useState(false);
  const [finTitlesFilterType, setFinTitlesFilterType] = useState<'income' | 'expense'>('expense');
  const [finTitlesFilters, setFinTitlesFilters] = useState<FinTitlesFilters>({});
  const [finTitlesIncomeFilters, setFinTitlesIncomeFilters] = useState<FinTitlesFilters>({});

  const applyFinFilters = (list: FinTitle[], f: FinTitlesFilters) => list.filter((t) => {
    if (f.invoiceNumber  && !t.invoice_number?.toLowerCase().includes(f.invoiceNumber.toLowerCase()))  return false;
    if (f.peopleId       && t.people_id !== f.peopleId) return false;
    if (f.documentNumber && !t.document_number?.toLowerCase().includes(f.documentNumber.toLowerCase())) return false;
    if (f.status?.length          && !f.status.includes(t.status))                   return false;
    if (f.bankId                  && t.bank_id            !== f.bankId)              return false;
    if (f.accountId               && t.account_id         !== f.accountId)           return false;
    if (f.paymentMethodId         && t.payment_method_id  !== f.paymentMethodId)     return false;
    if (f.amountValue && f.amountField) {
      const parsed = parseFloat(f.amountValue.replace(/\./g, "").replace(",", "."));
      if (!isNaN(parsed)) {
        const fieldMap: Record<string, number | null | undefined> = {
          amount:        t.amount,
          interest:      t.interest,
          interest_pct:  t.interest,
          discount:      t.discount,
          discount_pct:  t.discount,
          penalty:       t.multa,
          penalty_pct:   t.multa,
          amount_paid:   t.amount_paid,
        };
        const val = fieldMap[f.amountField];
        if (val == null || Math.abs(Number(val) - parsed) > 0.001) return false;
      }
    }
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

  const filteredFinTitles       = useMemo(() => applyFinFilters(finTitles,       finTitlesFilters),       [finTitles, finTitlesFilters]);
  const filteredFinTitlesIncome = useMemo(() => applyFinFilters(finTitlesIncome, finTitlesIncomeFilters), [finTitlesIncome, finTitlesIncomeFilters]);

  const countFilters = (f: FinTitlesFilters) => [
    f.invoiceNumber, f.peopleId, f.documentNumber,
    f.status?.length, f.dateValue, f.amountValue,
    f.bankId, f.accountId, f.paymentMethodId,
  ].filter(Boolean).length;

  const FIN_DATE_LABELS: Record<string, string> = { created_at: "Cadastro", issue_date: "Emissão", due_date: "Vencimento", paid_at: "Baixa", reversed_at: "Estorno", cancelled_at: "Cancelamento" };
  const FIN_AMOUNT_LABELS: Record<string, string> = { amount: "Valor", interest_pct: "Juros %", interest: "Juros", multa_pct: "Multa %", multa: "Multa", discount_pct: "Desconto %", discount: "Desconto", amount_paid: "Baixa" };
  const FIN_STATUS_LABELS: Record<string, string> = { pending: "Pendente", paid: "Pago", partial: "Pago Parcial", cancelled: "Cancelado", reversed: "Estornado" };

  const getFilterChips = (f: FinTitlesFilters, setF: (v: FinTitlesFilters) => void) => {
    const flatAcc = (list: FinAccount[]): FinAccount[] => list.flatMap(a => [a, ...flatAcc((a as any).children ?? [])]);
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.invoiceNumber)   chips.push({ key: 'invoiceNumber',   label: `Título: ${f.invoiceNumber}`,                                                                                 onRemove: () => setF({ ...f, invoiceNumber: undefined }) });
    if (f.peopleName)      chips.push({ key: 'people',          label: `Pessoa: ${f.peopleName}`,                                                                                    onRemove: () => setF({ ...f, peopleId: undefined, peopleName: undefined }) });
    if (f.documentNumber)  chips.push({ key: 'documentNumber',  label: `Documento: ${f.documentNumber}`,                                                                             onRemove: () => setF({ ...f, documentNumber: undefined }) });
    f.status?.forEach(s  => chips.push({ key: `status_${s}`,    label: `Status: ${FIN_STATUS_LABELS[s] ?? s}`,                                                                        onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date',   label: `${FIN_DATE_LABELS[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    if (f.amountValue)     chips.push({ key: 'amount',          label: `${FIN_AMOUNT_LABELS[f.amountField ?? 'amount'] ?? f.amountField}: R$ ${f.amountValue}`,                     onRemove: () => setF({ ...f, amountValue: undefined }) });
    if (f.bankId)          chips.push({ key: 'bank',            label: `Banco: ${finBanks.find(b => b.id === f.bankId)?.name ?? f.bankId}`,                                         onRemove: () => setF({ ...f, bankId: undefined }) });
    if (f.accountId)       chips.push({ key: 'account',         label: `Conta: ${flatAcc(finAccounts).find(a => a.id === f.accountId)?.name ?? f.accountId}`,                       onRemove: () => setF({ ...f, accountId: undefined }) });
    if (f.paymentMethodId) chips.push({ key: 'paymentMethod',   label: `Modalidade: ${finPaymentMethods.find(m => m.id === f.paymentMethodId)?.name ?? f.paymentMethodId}`,         onRemove: () => setF({ ...f, paymentMethodId: undefined }) });
    return chips;
  };

  const [finBanks, setFinBanks] = useState<FinBank[]>([]);
  const [finBanksLoading, setFinBanksLoading] = useState(false);
  const [finBanksSelected, setFinBanksSelected] = useState(0);
  const [finBankModalOpen, setFinBankModalOpen] = useState(false);
  const [editingFinBank, setEditingFinBank] = useState<FinBank | null>(null);
  const [finBanksFilterOpen, setFinBanksFilterOpen] = useState(false);
  const [finBanksFilters, setFinBanksFilters] = useState<FinBanksFilters>({});

  const [finPaymentMethods, setFinPaymentMethods] = useState<FinPaymentMethod[]>([]);
  const [finPaymentMethodsLoading, setFinPaymentMethodsLoading] = useState(false);
  const [finPaymentMethodsSelected, setFinPaymentMethodsSelected] = useState(0);
  const [finPaymentMethodModalOpen, setFinPaymentMethodModalOpen] = useState(false);
  const [editingFinPaymentMethod, setEditingFinPaymentMethod] = useState<FinPaymentMethod | null>(null);
  const [finPaymentMethodsFilterOpen, setFinPaymentMethodsFilterOpen] = useState(false);
  const [finPaymentMethodsFilters, setFinPaymentMethodsFilters] = useState<FinPaymentMethodsFilters>({});

  const [finPaymentMethodTypes, setFinPaymentMethodTypes] = useState<FinPaymentMethodType[]>([]);
  const [finPaymentMethodTypesLoading, setFinPaymentMethodTypesLoading] = useState(false);
  const [finPaymentMethodTypesSelected, setFinPaymentMethodTypesSelected] = useState(0);
  const [finPaymentMethodTypeModalOpen, setFinPaymentMethodTypeModalOpen] = useState(false);
  const [editingFinPaymentMethodType, setEditingFinPaymentMethodType] = useState<FinPaymentMethodType | null>(null);
  const [finPaymentMethodTypesFilterOpen, setFinPaymentMethodTypesFilterOpen] = useState(false);
  const [finPaymentMethodTypesFilters, setFinPaymentMethodTypesFilters] = useState<FinPaymentMethodTypesFilters>({});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsSelected, setDepartmentsSelected] = useState(0);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentsFilterOpen, setDepartmentsFilterOpen] = useState(false);
  const [departmentsFilters, setDepartmentsFilters] = useState<DepartmentsFilters>({});

  const [finAccounts, setFinAccounts] = useState<FinAccount[]>([]);
  const [finAccountsLoading, setFinAccountsLoading] = useState(false);
  const [finAccountModalOpen, setFinAccountModalOpen] = useState(false);
  const [editingFinAccount, setEditingFinAccount] = useState<FinAccount | null>(null);
  const [finAccountsFilterOpen, setFinAccountsFilterOpen] = useState(false);
  const [finAccountsFilters, setFinAccountsFilters] = useState<FinAccountsFilters>({});
  const [parentFinAccount, setParentFinAccount] = useState<FinAccount | null>(null);

  const [finExtract, setFinExtract] = useState<FinExtractEntry[]>([]);
  const [finExtractInitialBalance, setFinExtractInitialBalance] = useState<number | null>(null);
  const [finExtractLoading, setFinExtractLoading] = useState(false);
  const [finExtractView, setFinExtractViewState] = useState<ExtractView>(
    () => (localStorage.getItem(EXTRACT_VIEW_KEY) as ExtractView) ?? "grid"
  );
  const setFinExtractView = (v: ExtractView) => {
    localStorage.setItem(EXTRACT_VIEW_KEY, v);
    setFinExtractViewState(v);
  };
  const [finExtractFilterOpen, setFinExtractFilterOpen] = useState(false);
  const [finExtractFilters, setFinExtractFilters] = useState<FinExtractFilters>({});
  const [finExtractModalOpen, setFinExtractModalOpen] = useState(false);

  const applyExtractFilters = (list: FinExtractEntry[], f: FinExtractFilters) => list.filter((e) => {
    if (f.peopleId  && e.people_id  !== f.peopleId)  return false;
    if (f.type      && e.type       !== f.type)       return false;
    if (f.sources?.length && !f.sources.includes(e.source)) return false;
    if (f.bankId    && e.bank_id    !== f.bankId)     return false;
    if (f.accountId && e.account_id !== f.accountId)  return false;
    if (f.paymentMethodId && e.payment_method_id !== f.paymentMethodId) return false;
    if (f.amountValue) {
      const parsed = parseFloat(f.amountValue.replace(/\./g, "").replace(",", "."));
      if (!isNaN(parsed) && Math.abs(e.amount - parsed) > 0.001) return false;
    }
    if (f.dateValue) {
      const d = new Date(e.date.length === 10 ? e.date + "T00:00:00" : e.date);
      const v = f.dateValue;
      if (v.operator === "is"      && v.startDate && d.toDateString() !== v.startDate.toDateString()) return false;
      if (v.operator === "before"  && v.startDate && d >= v.startDate)  return false;
      if (v.operator === "after"   && v.startDate && d <= v.startDate)  return false;
      if (v.operator === "between" && v.startDate && v.endDate && (d < v.startDate || d > v.endDate)) return false;
    }
    return true;
  });

  const filteredFinExtract = useMemo(
    () => applyExtractFilters(finExtract, finExtractFilters),
    [finExtract, finExtractFilters]
  );

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

  useEffect(() => {
    if (!loggedIn) return;
    setEventTypesLoading(true);
    api.get<EventType[]>('/event-types')
      .then(res => setEventTypes(res.data))
      .finally(() => setEventTypesLoading(false));
  }, [loggedIn]);

  const handleEventTypesReorder = async (id: number, newOrder: number) => {
    await api.put(`/event-types/${id}`, { order: newOrder });
    const res = await api.get<EventType[]>('/event-types');
    setEventTypes(res.data);
  };

  const handleEventTypesDelete = async (id: number) => {
    await api.delete(`/event-types/${id}`);
    setEventTypes(prev => prev.filter(et => et.id !== id));
  };

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
    const today = new Date().toISOString().split('T')[0];
    await Promise.all(finTitlesSelectedIds.map(id => api.put(`/fin-titles/${id}`, { status: 'cancelled' })));
    setFinTitles(prev => prev.map(t => finTitlesSelectedIds.includes(t.id) ? { ...t, status: 'cancelled', cancelled_at: today } : t));
    setFinTitlesSelectedIds([]);
    setFinTitlesSelected(0);
    setFinTitlesAllPending(false);
    setFinTitlesClearKey(k => k + 1);
  };

  const handleBulkCancelIncome = async () => {
    const today = new Date().toISOString().split('T')[0];
    await Promise.all(finTitlesIncomeSelectedIds.map(id => api.put(`/fin-titles/${id}`, { status: 'cancelled' })));
    setFinTitlesIncome(prev => prev.map(t => finTitlesIncomeSelectedIds.includes(t.id) ? { ...t, status: 'cancelled', cancelled_at: today } : t));
    setFinTitlesIncomeSelectedIds([]);
    setFinTitlesIncomeSelected(0);
    setFinTitlesIncomeAllPending(false);
    setFinTitlesIncomeClearKey(k => k + 1);
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

  const applyFinBanksFilters = (list: FinBank[], f: FinBanksFilters) => list.filter((b) => {
    if (f.filterId   && !String(b.id).includes(f.filterId))                          return false;
    if (f.filterName && !b.name.toLowerCase().includes(f.filterName.toLowerCase()))  return false;
    if (f.filterBank && !(b.bank ?? "").toLowerCase().includes(f.filterBank.toLowerCase())) return false;
    if (f.main && f.main !== "all") {
      const wantsMain = f.main === "true";
      if (b.main !== wantsMain) return false;
    }
    if (f.status?.length) {
      const isActive = b.active ? "active" : "inactive";
      if (!f.status.includes(isActive)) return false;
    }
    if (f.dateValue && f.dateField) {
      const raw = (b as Record<string, unknown>)[f.dateField] as string | null;
      if (!raw) return false;
      const dDay = new Date(raw); dDay.setHours(0, 0, 0, 0);
      if (!matchesDateFilter(dDay, f.dateValue)) return false;
    }
    return true;
  });

  const filteredFinBanks = useMemo(() => applyFinBanksFilters(finBanks, finBanksFilters), [finBanks, finBanksFilters]);

  const countFinBanksFilters = (f: FinBanksFilters) =>
    [f.filterId, f.filterName, f.filterBank, f.main && f.main !== "all" ? f.main : undefined, f.status?.length, f.dateValue].filter(Boolean).length;

  const getFinBanksFilterChips = (f: FinBanksFilters, setF: (v: FinBanksFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)   chips.push({ key: 'id',   label: `ID: ${f.filterId}`,     onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.filterName) chips.push({ key: 'name', label: `Nome: ${f.filterName}`, onRemove: () => setF({ ...f, filterName: undefined }) });
    if (f.filterBank) chips.push({ key: 'bank', label: `Banco: ${f.filterBank}`, onRemove: () => setF({ ...f, filterBank: undefined }) });
    if (f.main && f.main !== "all") chips.push({ key: 'main', label: `Principal: ${f.main === "true" ? "Sim" : "Não"}`, onRemove: () => setF({ ...f, main: undefined }) });
    f.status?.forEach(s => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Ativo" : "Inativo"}`, onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${{ created_at: "Criado em", updated_at: "Editado em" }[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
  };

  const applyFinPaymentMethodsFilters = (list: FinPaymentMethod[], f: FinPaymentMethodsFilters) => list.filter((m) => {
    if (f.filterId   && !String(m.id).includes(f.filterId))                               return false;
    if (f.filterName && !m.name.toLowerCase().includes(f.filterName.toLowerCase()))       return false;
    if (f.typeIds?.length && !f.typeIds.includes(m.fin_payment_method_type_id!))           return false;
    if (f.bankIds?.length && !f.bankIds.includes(m.fin_bank_id!))                         return false;
    if (f.status?.length) {
      const wantActive   = f.status.includes("active");
      const wantInactive = f.status.includes("inactive");
      if (wantActive && !wantInactive && !m.active)  return false;
      if (!wantActive && wantInactive && m.active)   return false;
    }
    if (f.dateField && f.dateValue) {
      const raw = (m as Record<string, unknown>)[f.dateField] as string | null;
      if (raw) {
        const d = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
        const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (!matchesDateFilter(dDay, f.dateValue)) return false;
      }
    }
    return true;
  });

  const filteredFinPaymentMethods = useMemo(() => applyFinPaymentMethodsFilters(finPaymentMethods, finPaymentMethodsFilters), [finPaymentMethods, finPaymentMethodsFilters]);

  const countFinPaymentMethodsFilters = (f: FinPaymentMethodsFilters) =>
    [f.filterId, f.filterName, f.typeIds?.length, f.bankIds?.length, f.status?.length, f.dateValue].filter(Boolean).length;

  const getFinPaymentMethodsFilterChips = (f: FinPaymentMethodsFilters, setF: (v: FinPaymentMethodsFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)   chips.push({ key: 'id',   label: `ID: ${f.filterId}`,     onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.filterName) chips.push({ key: 'name', label: `Nome: ${f.filterName}`, onRemove: () => setF({ ...f, filterName: undefined }) });
    f.typeIds?.forEach(id => chips.push({ key: `type_${id}`, label: `Tipo: ${finPaymentMethodTypes.find(t => t.id === id)?.name ?? id}`, onRemove: () => setF({ ...f, typeIds: f.typeIds!.filter(x => x !== id) }) }));
    f.bankIds?.forEach(id => chips.push({ key: `bank_${id}`, label: `Banco: ${finBanks.find(b => b.id === id)?.name ?? id}`, onRemove: () => setF({ ...f, bankIds: f.bankIds!.filter(x => x !== id) }) }));
    f.status?.forEach(s => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Ativo" : "Inativo"}`, onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${{ created_at: "Criado em", updated_at: "Editado em" }[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
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

  const applyFinPaymentMethodTypesFilters = (list: FinPaymentMethodType[], f: FinPaymentMethodTypesFilters) => list.filter((t) => {
    if (f.filterId   && !String(t.id).includes(f.filterId))                          return false;
    if (f.filterName && !t.name.toLowerCase().includes(f.filterName.toLowerCase()))  return false;
    if (f.status?.length) {
      const isActive = t.active ? "active" : "inactive";
      if (!f.status.includes(isActive)) return false;
    }
    if (f.dateValue && f.dateField) {
      const raw = (t as Record<string, unknown>)[f.dateField] as string | null;
      if (!raw) return false;
      const dDay = new Date(raw); dDay.setHours(0, 0, 0, 0);
      if (!matchesDateFilter(dDay, f.dateValue)) return false;
    }
    return true;
  });

  const filteredFinPaymentMethodTypes = useMemo(() => applyFinPaymentMethodTypesFilters(finPaymentMethodTypes, finPaymentMethodTypesFilters), [finPaymentMethodTypes, finPaymentMethodTypesFilters]);

  const countFinPaymentMethodTypesFilters = (f: FinPaymentMethodTypesFilters) =>
    [f.filterId, f.filterName, f.status?.length, f.dateValue].filter(Boolean).length;

  const getFinPaymentMethodTypesFilterChips = (f: FinPaymentMethodTypesFilters, setF: (v: FinPaymentMethodTypesFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)   chips.push({ key: 'id',   label: `ID: ${f.filterId}`,     onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.filterName) chips.push({ key: 'name', label: `Nome: ${f.filterName}`, onRemove: () => setF({ ...f, filterName: undefined }) });
    f.status?.forEach(s => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Ativo" : "Inativo"}`, onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${{ created_at: "Criado em", updated_at: "Editado em" }[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
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

  const applyDepartmentsFilters = (list: Department[], f: DepartmentsFilters) => list.filter((d) => {
    if (f.filterId   && !String(d.id).includes(f.filterId))                         return false;
    if (f.filterName && !d.name.toLowerCase().includes(f.filterName.toLowerCase())) return false;
    if (f.status?.length) {
      const wantActive   = f.status.includes("active");
      const wantInactive = f.status.includes("inactive");
      if (wantActive && !wantInactive && !d.active)  return false;
      if (!wantActive && wantInactive && d.active)   return false;
    }
    if (f.dateField && f.dateValue) {
      const raw = (d as Record<string, unknown>)[f.dateField] as string | null;
      if (raw) {
        const dt = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
        const dDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        if (!matchesDateFilter(dDay, f.dateValue)) return false;
      }
    }
    return true;
  });

  const filteredDepartments = useMemo(() => applyDepartmentsFilters(departments, departmentsFilters), [departments, departmentsFilters]);

  const countDepartmentsFilters = (f: DepartmentsFilters) =>
    [f.filterId, f.filterName, f.status?.length, f.dateValue].filter(Boolean).length;

  const getDepartmentsFilterChips = (f: DepartmentsFilters, setF: (v: DepartmentsFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (f.filterId)   chips.push({ key: 'id',   label: `ID: ${f.filterId}`,     onRemove: () => setF({ ...f, filterId: undefined }) });
    if (f.filterName) chips.push({ key: 'name', label: `Nome: ${f.filterName}`, onRemove: () => setF({ ...f, filterName: undefined }) });
    f.status?.forEach(s => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Ativo" : "Inativo"}`, onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${{ created_at: "Criado em", updated_at: "Editado em" }[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
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
    api.get<{ entries: FinExtractEntry[]; initial_balance: number | null }>('/fin-extract')
      .then(res => {
        setFinExtract(res.data.entries);
        setFinExtractInitialBalance(res.data.initial_balance);
      })
      .catch(() => { setFinExtract([]); setFinExtractInitialBalance(null); })
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

  const flattenFinAccounts = (nodes: FinAccount[]): FinAccount[] =>
    nodes.flatMap(n => [n, ...flattenFinAccounts(n.children ?? [])]);

  const filterFinAccountTree = (nodes: FinAccount[], f: FinAccountsFilters): FinAccount[] => {
    const hasActive = !!(f.filterName || f.types?.length || f.natures?.length || f.status?.length || f.dateValue);
    if (!hasActive) return nodes;
    const flat = flattenFinAccounts(nodes);
    const matchingIds = new Set(flat.filter(a => {
      if (f.filterName && !a.name.toLowerCase().includes(f.filterName.toLowerCase()) && !(a.code ?? "").toLowerCase().includes(f.filterName.toLowerCase())) return false;
      if (f.types?.length   && !f.types.includes(a.type))     return false;
      if (f.natures?.length && !f.natures.includes(a.nature)) return false;
      if (f.status?.length) {
        const wantActive = f.status.includes("active");
        const wantInactive = f.status.includes("inactive");
        if (wantActive && !wantInactive && !a.active)  return false;
        if (!wantActive && wantInactive && a.active)   return false;
      }
      if (f.dateField && f.dateValue) {
        const raw = (a as Record<string, unknown>)[f.dateField] as string | null;
        if (raw) {
          const dt = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
          const dDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
          if (!matchesDateFilter(dDay, f.dateValue)) return false;
        }
      }
      return true;
    }).map(a => a.id));
    const includeIds = new Set<number>(matchingIds);
    for (const id of matchingIds) {
      let item = flat.find(a => a.id === id);
      while (item?.parent_id) {
        includeIds.add(item.parent_id);
        item = flat.find(a => a.id === item!.parent_id);
      }
    }
    const rebuild = (items: FinAccount[]): FinAccount[] =>
      items.filter(a => includeIds.has(a.id)).map(a => ({ ...a, children: rebuild(a.children ?? []) }));
    return rebuild(nodes);
  };

  const filteredFinAccounts = useMemo(() => filterFinAccountTree(finAccounts, finAccountsFilters), [finAccounts, finAccountsFilters]);

  const countFinAccountsFilters = (f: FinAccountsFilters) =>
    [f.filterName, f.types?.length, f.natures?.length, f.status?.length, f.dateValue].filter(Boolean).length;

  const getFinAccountsFilterChips = (f: FinAccountsFilters, setF: (v: FinAccountsFilters) => void) => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    const TYPE_LABELS: Record<string, string> = { asset: "Ativo", liability: "Passivo", revenue: "Receita", expense: "Despesa", cost: "Custo" };
    const NATURE_LABELS: Record<string, string> = { analytic: "Analítica", synthetic: "Sintética" };
    if (f.filterName) chips.push({ key: 'name', label: `Nome: ${f.filterName}`, onRemove: () => setF({ ...f, filterName: undefined }) });
    f.types?.forEach(t   => chips.push({ key: `type_${t}`,   label: `Tipo: ${TYPE_LABELS[t] ?? t}`,       onRemove: () => setF({ ...f, types:   f.types!.filter(x => x !== t) }) }));
    f.natures?.forEach(n => chips.push({ key: `nature_${n}`, label: `Natureza: ${NATURE_LABELS[n] ?? n}`, onRemove: () => setF({ ...f, natures: f.natures!.filter(x => x !== n) }) }));
    f.status?.forEach(s  => chips.push({ key: `status_${s}`, label: `Status: ${s === "active" ? "Ativo" : "Inativo"}`, onRemove: () => setF({ ...f, status: f.status!.filter(x => x !== s) }) }));
    if (f.dateField && f.dateValue) chips.push({ key: 'date', label: `${{ created_at: "Criado em", updated_at: "Editado em" }[f.dateField] ?? f.dateField}: ${formatDateValue(f.dateValue, undefined, "dd/MM/yyyy")}`, onRemove: () => setF({ ...f, dateValue: undefined }) });
    return chips;
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
      <EventTypesModal
        open={eventTypesModalOpen || !!editingEventType}
        eventType={editingEventType}
        onClose={() => { setEventTypesModalOpen(false); setEditingEventType(null); }}
        onSaved={(saved) => {
          setEventTypes(prev => {
            const idx = prev.findIndex(et => et.id === saved.id);
            return idx >= 0 ? prev.map(et => et.id === saved.id ? saved : et) : [...prev, saved];
          });
          setEventTypesModalOpen(false);
          setEditingEventType(null);
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
      <FinBanksFilterModal
        open={finBanksFilterOpen}
        filters={finBanksFilters}
        onClose={() => setFinBanksFilterOpen(false)}
        onApply={(f) => setFinBanksFilters(f)}
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
      <FinPaymentMethodsFilterModal
        open={finPaymentMethodsFilterOpen}
        filters={finPaymentMethodsFilters}
        onClose={() => setFinPaymentMethodsFilterOpen(false)}
        onApply={(f) => setFinPaymentMethodsFilters(f)}
      />
      <FinPaymentMethodTypesFilterModal
        open={finPaymentMethodTypesFilterOpen}
        filters={finPaymentMethodTypesFilters}
        onClose={() => setFinPaymentMethodTypesFilterOpen(false)}
        onApply={(f) => { setFinPaymentMethodTypesFilters(f); setFinPaymentMethodTypesFilterOpen(false); }}
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
      <DepartmentsFilterModal
        open={departmentsFilterOpen}
        filters={departmentsFilters}
        onClose={() => setDepartmentsFilterOpen(false)}
        onApply={(f) => setDepartmentsFilters(f)}
      />
      <FinAccountModal
        open={finAccountModalOpen || !!editingFinAccount}
        account={editingFinAccount}
        parentAccount={parentFinAccount}
        onClose={() => { setFinAccountModalOpen(false); setEditingFinAccount(null); setParentFinAccount(null); }}
        onSaved={handleFinAccountSaved}
      />
      <FinAccountsFilterModal
        open={finAccountsFilterOpen}
        filters={finAccountsFilters}
        onClose={() => setFinAccountsFilterOpen(false)}
        onApply={(f) => setFinAccountsFilters(f)}
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
        filters={finTitlesFilterType === 'expense' ? finTitlesFilters : finTitlesIncomeFilters}
        titleType={finTitlesFilterType}
        onClose={() => setFinTitlesFilterOpen(false)}
        onApply={(f) => finTitlesFilterType === 'expense' ? setFinTitlesFilters(f) : setFinTitlesIncomeFilters(f)}
      />
      <FinExtractFilterModal
        open={finExtractFilterOpen}
        filters={finExtractFilters}
        onClose={() => setFinExtractFilterOpen(false)}
        onApply={(f) => setFinExtractFilters(f)}
      />
      <FinExtractModal
        open={finExtractModalOpen}
        onClose={() => setFinExtractModalOpen(false)}
        onSaved={() => {
          setFinExtractLoading(true);
          api.get<{ entries: FinExtractEntry[]; initial_balance: number | null }>('/fin-extract')
            .then((res) => { setFinExtract(res.data.entries); setFinExtractInitialBalance(res.data.initial_balance); })
            .catch(() => {})
            .finally(() => setFinExtractLoading(false));
        }}
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
            setFinTitlesClearKey(k => k + 1);
            api.get<FinTitle[]>('/fin-titles?type=expense').then(res => setFinTitles(res.data)).catch(() => {}).finally(() => setFinTitlesLoading(false));
          } else {
            setFinTitlesIncomeLoading(true);
            setFinTitlesIncomeClearKey(k => k + 1);
            api.get<FinTitle[]>('/fin-titles?type=income').then(res => setFinTitlesIncome(res.data)).catch(() => {}).finally(() => setFinTitlesIncomeLoading(false));
          }
        }}
      />
      <PeopleFilterModal
        open={peopleFilterOpen}
        filters={peopleFilters}
        onClose={() => setPeopleFilterOpen(false)}
        onApply={(f) => setPeopleFilters(f)}
      />
      <TypePeopleFilterModal
        open={typePeopleFilterOpen}
        filters={typePeopleFilters}
        onClose={() => setTypePeopleFilterOpen(false)}
        onApply={(f) => setTypePeopleFilters(f)}
      />
      <TypeContactsFilterModal
        open={typeContactsFilterOpen}
        filters={typeContactsFilters}
        onClose={() => setTypeContactsFilterOpen(false)}
        onApply={(f) => setTypeContactsFilters(f)}
      />
      <TypeAddressesFilterModal
        open={typeAddressesFilterOpen}
        filters={typeAddressesFilters}
        onClose={() => setTypeAddressesFilterOpen(false)}
        onApply={(f) => setTypeAddressesFilters(f)}
      />
      <TypeDocumentsFilterModal
        open={typeDocumentsFilterOpen}
        filters={typeDocumentsFilters}
        onClose={() => setTypeDocumentsFilterOpen(false)}
        onApply={(f) => setTypeDocumentsFilters(f)}
      />
      <PermissionActionsFilterModal
        open={permissionActionsFilterOpen}
        filters={permissionActionsFilters}
        modules={permissionActionsModules}
        onClose={() => setPermissionActionsFilterOpen(false)}
        onApply={(f) => setPermissionActionsFilters(f)}
      />
      <GabinetesFilterModal
        open={gabinetesFilterOpen}
        filters={gabinetesFilters}
        onClose={() => setGabinetesFilterOpen(false)}
        onApply={(f) => setGabinetesFilters(f)}
      />
      <EventTypesFilterModal
        open={eventTypesFilterOpen}
        filters={eventTypesFilters}
        colors={eventTypes.map(et => ({ color: et.color, name: et.name }))}
        onClose={() => setEventTypesFilterOpen(false)}
        onApply={(f) => setEventTypesFilters(f)}
      />
      <PeopleModal
        open={peopleModalOpen || !!editingPerson}
        person={editingPerson}
        typePeople={typePeople}
        typeContacts={typeContacts}
        typeAddresses={typeAddresses}
        typeDocuments={typeDocuments}
        onClose={() => { setPeopleModalOpen(false); setEditingPerson(null); api.get<Person[]>('/people').then(res => setPeople(res.data)).catch(() => {}); }}
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
                  <TabsTrigger value="metrics"><CalendarDays className="size-3.5" />Agenda</TabsTrigger>
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
                      <Button variant="outline" size="sm" onClick={() => setGabinetesFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countGabinetesFilters(gabinetesFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countGabinetesFilters(gabinetesFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getGabinetesFilterChips(gabinetesFilters, setGabinetesFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <GabinetesDataGrid tenants={filteredTenants} isLoading={tenantsLoading} onSelectionChange={setTenantsSelected} onEdit={setEditingTenant} />
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
          <AgendaTab />
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
                    <Button variant="outline" size="sm" onClick={() => setPeopleFilterOpen(true)}>
                      <Search className="size-4 mr-2" />
                      Pesquisar
                      {countPeopleFilters(peopleFilters) > 0 && (
                        <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                          {countPeopleFilters(peopleFilters)}
                        </Badge>
                      )}
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setPeopleModalOpen(true)}>
                      <Plus className="size-4 mr-2" />
                      Novo Registro
                    </Button>
                  </>
                )}
              </div>
            </div>
            {(() => { const chips = getPeopleFilterChips(peopleFilters, setPeopleFilters); return chips.length > 0 && (
              <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-muted-foreground">Filtros:</span>
                {chips.map(chip => (
                  <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {chip.label}
                    <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                  </span>
                ))}
              </div>
            ); })()}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <PeopleDataGrid
                people={filteredPeople}
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
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><BookmarkCheck className="size-5 text-muted-foreground" />Tipos de Modalidade <Badge variant="success" appearance="light" size="md">{formatRecordCount(filteredFinPaymentMethodTypes.length)}</Badge></h2>
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
                      <Button variant="outline" size="sm" onClick={() => setFinPaymentMethodTypesFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countFinPaymentMethodTypesFilters(finPaymentMethodTypesFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1">
                            {countFinPaymentMethodTypesFilters(finPaymentMethodTypesFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setFinPaymentMethodTypeModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getFinPaymentMethodTypesFilterChips(finPaymentMethodTypesFilters, setFinPaymentMethodTypesFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinPaymentMethodTypesDataGrid
                  types={filteredFinPaymentMethodTypes}
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
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><CreditCard className="size-5 text-muted-foreground" />Modalidades de Pagamento <Badge variant="success" appearance="light" size="md">{formatRecordCount(filteredFinPaymentMethods.length)}</Badge></h2>
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
                      <Button variant="outline" size="sm" onClick={() => setFinPaymentMethodsFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countFinPaymentMethodsFilters(finPaymentMethodsFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countFinPaymentMethodsFilters(finPaymentMethodsFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setFinPaymentMethodModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getFinPaymentMethodsFilterChips(finPaymentMethodsFilters, setFinPaymentMethodsFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(c => (
                    <Badge key={c.key} variant="outline" size="sm" className="gap-1 cursor-pointer" onClick={c.onRemove}>
                      {c.label} <X className="size-3" />
                    </Badge>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinPaymentMethodsDataGrid
                  methods={filteredFinPaymentMethods}
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
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><Building className="size-5 text-muted-foreground" />Departamentos <Badge variant="success" appearance="light" size="md">{formatRecordCount(filteredDepartments.length)}</Badge></h2>
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
                      <Button variant="outline" size="sm" onClick={() => setDepartmentsFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countDepartmentsFilters(departmentsFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countDepartmentsFilters(departmentsFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setDepartmentModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getDepartmentsFilterChips(departmentsFilters, setDepartmentsFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(c => (
                    <Badge key={c.key} variant="outline" size="sm" className="gap-1 pr-1">
                      {c.label}
                      <button onClick={c.onRemove} className="ml-0.5 hover:text-destructive transition-colors"><X className="size-3" /></button>
                    </Badge>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <DepartmentsDataGrid
                  departments={filteredDepartments}
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
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><LayoutList className="size-5 text-muted-foreground" />Plano de Contas <Badge variant="success" appearance="light" size="md">{formatRecordCount(flattenFinAccounts(filteredFinAccounts).length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Plano de Contas']} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setFinAccountsFilterOpen(true)}>
                    <Search className="size-4 mr-2" />
                    Pesquisar
                    {countFinAccountsFilters(finAccountsFilters) > 0 && (
                      <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                        {countFinAccountsFilters(finAccountsFilters)}
                      </Badge>
                    )}
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => { setParentFinAccount(null); setFinAccountModalOpen(true); }}>
                    <Plus className="size-4 mr-2" />
                    Novo Registro
                  </Button>
                </div>
              </div>
              {(() => { const chips = getFinAccountsFilterChips(finAccountsFilters, setFinAccountsFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(c => (
                    <Badge key={c.key} variant="outline" size="sm" className="gap-1 pr-1">
                      {c.label}
                      <button onClick={c.onRemove} className="ml-0.5 hover:text-destructive transition-colors"><X className="size-3" /></button>
                    </Badge>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <FinAccountsTree
                  accounts={filteredFinAccounts}
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
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><Landmark className="size-5 text-muted-foreground" />Bancos <Badge variant="success" appearance="light" size="md">{formatRecordCount(filteredFinBanks.length)}</Badge></h2>
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
                      <Button variant="outline" size="sm" onClick={() => setFinBanksFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countFinBanksFilters(finBanksFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countFinBanksFilters(finBanksFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setFinBankModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getFinBanksFilterChips(finBanksFilters, setFinBanksFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(c => (
                    <span key={c.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {c.label}
                      <button onClick={c.onRemove} className="hover:opacity-70 transition-opacity leading-none">×</button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinBanksDataGrid
                  banks={filteredFinBanks}
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
                    <Badge variant="success" appearance="light" size="md">{formatRecordCount(filteredFinExtract.length)}</Badge>
                  </h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Extrato']} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setFinExtractFilterOpen(true)}>
                    <Search className="size-4 mr-2" />
                    Pesquisar
                  </Button>
                  <Button variant="primary" size="sm" className="h-8" onClick={() => setFinExtractModalOpen(true)}>
                    <Plus className="size-4 mr-2" />
                    Novo Lançamento
                  </Button>
                  <ExtractViewToggle view={finExtractView} onChange={setFinExtractView} />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinExtractDataGrid entries={filteredFinExtract} initialBalance={finExtractInitialBalance} isLoading={finExtractLoading} view={finExtractView} />
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setFinTitlesIncomeClearKey(k => k + 1)}>
                          Desmarcar Todos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setFinTitlesFilterType('income'); setFinTitlesFilterOpen(true); }} className={countFilters(finTitlesIncomeFilters) > 0 ? "border-primary text-primary" : ""}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countFilters(finTitlesIncomeFilters) > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4">{countFilters(finTitlesIncomeFilters)}</span>
                        )}
                      </Button>
                      {countFilters(finTitlesIncomeFilters) > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setFinTitlesIncomeFilters({})} title="Limpar filtros">
                          <X className="size-4" />
                        </Button>
                      )}
                      <Button variant="primary" size="sm" onClick={() => { setFinTitleDefaultType('income'); setFinTitleModalOpen(true); }}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getFilterChips(finTitlesIncomeFilters, setFinTitlesIncomeFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 flex flex-col p-6">
                <FinTitlesDataGrid
                  titles={filteredFinTitlesIncome}
                  isLoading={finTitlesIncomeLoading}
                  clearSelectionKey={finTitlesIncomeClearKey}
                  onSelectionChange={(count, allPending, ids, allSamePeople, items) => { setFinTitlesIncomeSelected(count); setFinTitlesIncomeAllPending(allPending); setFinTitlesIncomeSelectedIds(ids); setFinTitlesIncomeAllSamePeople(allSamePeople); setFinTitlesIncomeSelectedItems(items); }}
                  onEdit={(t) => { setFinTitleInitialTab("geral"); setEditingFinTitle(t); setFinTitleModalOpen(true); }}
                  onBaixar={(t) => { setFinTitleInitialTab("baixar"); setEditingFinTitle(t); setFinTitleModalOpen(true); }}
                />
              </div>
              <PageFooter />
            </div>
          ) : finSection === 'fin-wallets' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5">
                    <Wallet className="size-5" />
                    Carteira
                  </h2>
                  <SectionBreadcrumb items={['Home', 'Finanças', 'Carteira']} />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <FinWalletTab />
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setFinTitlesClearKey(k => k + 1)}>
                          Desmarcar Todos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setFinTitlesFilterType('expense'); setFinTitlesFilterOpen(true); }} className={countFilters(finTitlesFilters) > 0 ? "border-primary text-primary" : ""}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countFilters(finTitlesFilters) > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4">{countFilters(finTitlesFilters)}</span>
                        )}
                      </Button>
                      {countFilters(finTitlesFilters) > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setFinTitlesFilters({})} title="Limpar filtros">
                          <X className="size-4" />
                        </Button>
                      )}
                      <Button variant="primary" size="sm" onClick={() => { setFinTitleDefaultType('expense'); setFinTitleModalOpen(true); }}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getFilterChips(finTitlesFilters, setFinTitlesFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 flex flex-col p-6">
                <FinTitlesDataGrid
                  titles={filteredFinTitles}
                  isLoading={finTitlesLoading}
                  clearSelectionKey={finTitlesClearKey}
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
                      <Button variant="outline" size="sm" onClick={() => setTypePeopleFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countTypePeopleFilters(typePeopleFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countTypePeopleFilters(typePeopleFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypePeopleModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getTypePeopleFilterChips(typePeopleFilters, setTypePeopleFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <TypePeopleDataGrid
                  typePeople={filteredTypePeople}
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
                      <Button variant="outline" size="sm" onClick={() => setTypeContactsFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countTypeContactsFilters(typeContactsFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countTypeContactsFilters(typeContactsFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypeContactsModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getTypeContactsFilterChips(typeContactsFilters, setTypeContactsFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <TypeContactsDataGrid
                  typeContacts={filteredTypeContacts}
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
                      <Button variant="outline" size="sm" onClick={() => setTypeAddressesFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countTypeAddressesFilters(typeAddressesFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countTypeAddressesFilters(typeAddressesFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypeAddressesModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getTypeAddressesFilterChips(typeAddressesFilters, setTypeAddressesFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <TypeAddressesDataGrid
                  typeAddresses={filteredTypeAddresses}
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
                      <Button variant="outline" size="sm" onClick={() => setTypeDocumentsFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countTypeDocumentsFilters(typeDocumentsFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countTypeDocumentsFilters(typeDocumentsFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypeDocumentsModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getTypeDocumentsFilterChips(typeDocumentsFilters, setTypeDocumentsFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <TypeDocumentsDataGrid
                  typeDocuments={filteredTypeDocuments}
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
                      <Button variant="outline" size="sm" onClick={() => setPeopleFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countPeopleFilters(peopleFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countPeopleFilters(peopleFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setPeopleModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getPeopleFilterChips(peopleFilters, setPeopleFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <PeopleDataGrid
                  people={filteredPeople}
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
                      <Button variant="outline" size="sm" onClick={() => setGabinetesFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countGabinetesFilters(gabinetesFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countGabinetesFilters(gabinetesFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getGabinetesFilterChips(gabinetesFilters, setGabinetesFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <GabinetesDataGrid tenants={filteredTenants} isLoading={tenantsLoading} onSelectionChange={setTenantsSelected} onEdit={setEditingTenant} />
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
                      <Button variant="outline" size="sm" onClick={() => setPermissionActionsFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countPermissionActionsFilters(permissionActionsFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countPermissionActionsFilters(permissionActionsFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setPermissionActionsModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getPermissionActionsFilterChips(permissionActionsFilters, setPermissionActionsFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <PermissionActionsDataGrid
                  permissionActions={filteredPermissionActions}
                  isLoading={permissionActionsLoading}
                  onEdit={(pa) => setEditingPermissionAction(pa)}
                  onDelete={handlePermissionActionDelete}
                  onAddToModule={(module) => { setEditingPermissionAction({ id: 0, module, action: '', description: null }); }}
                />
              </div>
              <PageFooter />
            </div>
          ) : settingsSection === 'event-types' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5"><CalendarDays className="size-5" />Tipos de Evento <Badge variant="success" appearance="light" size="md">{formatRecordCount(eventTypes.length)}</Badge></h2>
                  <SectionBreadcrumb items={['Home', 'Cadastros', 'Agenda', 'Tipos de Evento']} />
                </div>
                <div className="flex items-center gap-2">
                  {eventTypesSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({eventTypesSelected}) <ChevronDown className="size-3 ml-1" />
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
                      <Button variant="outline" size="sm" onClick={() => setEventTypesFilterOpen(true)}>
                        <Search className="size-4 mr-2" />
                        Pesquisar
                        {countEventTypesFilters(eventTypesFilters) > 0 && (
                          <Badge variant="primary" appearance="light" size="sm" className="ml-1.5">
                            {countEventTypesFilters(eventTypesFilters)}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setEventTypesModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(() => { const chips = getEventTypesFilterChips(eventTypesFilters, setEventTypesFilters); return chips.length > 0 && (
                <div className="px-6 py-2 border-b border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Filtros:</span>
                  {chips.map(chip => (
                    <span key={chip.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {chip.label}
                      <button onClick={chip.onRemove} className="hover:opacity-70"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              ); })()}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <EventTypesDataGrid
                  eventTypes={filteredEventTypes}
                  isLoading={eventTypesLoading}
                  onSelectionChange={setEventTypesSelected}
                  onEdit={(et) => setEditingEventType(et)}
                  onDelete={handleEventTypesDelete}
                  onReorder={handleEventTypesReorder}
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
