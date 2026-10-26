'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { listPublicAvailableRoomUnitsByRoomType, listPublicEstablishments, listPublicRoomTypesByEstablishment, listPublicServicesByEstablishment, type PublicRoomTypeResponse } from '@/modules/landing/api/publicCatalogApi';

import { getParishLabel } from '@/modules/establishments/constants/parishes';

interface CatalogCardItem {
  id: number;
  name: string;
  description: string;
  address: string;
  imageUrl: string | null;
  parish: string | null;
  services: string[];
  roomTypes: PublicRoomTypeResponse[];
}

interface SearchRecommendation {
  roomType: PublicRoomTypeResponse;
  availableUnits: number;
}

async function loadPublicCatalog(): Promise<CatalogCardItem[]> {
  const establishments = await listPublicEstablishments();

  const cards: CatalogCardItem[] = await Promise.all(
    establishments.map(async (establishment) => {
      const [services, roomTypes] = await Promise.all([listPublicServicesByEstablishment(establishment.id), listPublicRoomTypesByEstablishment(establishment.id)]);

      return {
        id: establishment.id,
        name: establishment.name,
        description: establishment.description,
        address: establishment.address,
        imageUrl: establishment.images.find((img) => img.isPrimary)?.url ?? null,
        parish: establishment.parish,
        services: services.map((service) => service.name),
        roomTypes
      };
    })
  );

  return cards;
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

const SORT_OPTIONS = [
  { label: 'Nombre A-Z', value: 'NAME_ASC' },
  { label: 'Nombre Z-A', value: 'NAME_DESC' }
];

export default function LandingPage() {
  const [searchText, setSearchText] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [sortBy, setSortBy] = useState<'NAME_ASC' | 'NAME_DESC'>('NAME_ASC');

  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState<number>(2);

  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchRecommendations, setSearchRecommendations] = useState<Record<number, SearchRecommendation>>({});
  const [activeSearchDates, setActiveSearchDates] = useState<{
    checkInDate: string;
    checkOutDate: string;
  } | null>(null);

  const catalogQuery = useQuery({
    queryKey: ['public-catalog'],
    queryFn: loadPublicCatalog
  });

  const allCards: CatalogCardItem[] = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);

  const serviceOptions = useMemo(() => {
    const values = new Set<string>(allCards.flatMap((card: CatalogCardItem) => card.services));
    const sorted: string[] = Array.from(values).sort((a: string, b: string) => a.localeCompare(b, 'es'));
    return [{ label: 'Todos', value: '' }, ...sorted.map((s: string) => ({ label: s, value: s }))];
  }, [allCards]);

  const globalPriceRange = useMemo(() => {
    const prices = allCards.flatMap((card) => card.roomTypes.map((roomType) => roomType.pricePerNight));
    const validPrices = prices.filter((price) => isFiniteNumber(price) && price >= 0);

    if (validPrices.length === 0) {
      return { min: 0, max: 0 };
    }

    return {
      min: Math.min(...validPrices),
      max: Math.max(...validPrices)
    };
  }, [allCards]);

  useEffect(() => {
    if (allCards.length === 0) return;
    if (priceMin === null) setPriceMin(globalPriceRange.min);
    if (priceMax === null) setPriceMax(globalPriceRange.max);
  }, [allCards.length, globalPriceRange.max, globalPriceRange.min, priceMax, priceMin]);

  const effectivePriceMin = priceMin !== null && isFiniteNumber(priceMin) ? priceMin : globalPriceRange.min;
  const effectivePriceMax = priceMax !== null && isFiniteNumber(priceMax) ? priceMax : globalPriceRange.max;

  const filteredCatalog = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase('es');

    const filtered = allCards.filter((card) => {
      const searchMatch =
        normalizedSearch.length === 0 || card.name.toLocaleLowerCase('es').includes(normalizedSearch) || card.description.toLocaleLowerCase('es').includes(normalizedSearch) || card.address.toLocaleLowerCase('es').includes(normalizedSearch);

      const serviceMatch = serviceFilter.length === 0 || card.services.includes(serviceFilter);

      const hasRoomTypeInPriceRange = card.roomTypes.length === 0 || card.roomTypes.some((roomType) => roomType.pricePerNight >= effectivePriceMin && roomType.pricePerNight <= effectivePriceMax);

      const searchAvailabilityMatch = !hasSearched || Boolean(searchRecommendations[card.id]);

      return searchMatch && serviceMatch && hasRoomTypeInPriceRange && searchAvailabilityMatch;
    });

    return filtered.sort((a, b) => (sortBy === 'NAME_ASC' ? a.name.localeCompare(b.name, 'es') : b.name.localeCompare(a.name, 'es')));
  }, [allCards, effectivePriceMax, effectivePriceMin, hasSearched, searchRecommendations, searchText, serviceFilter, sortBy]);

  async function runAvailabilitySearch() {
    if (!checkInDate || !checkOutDate) {
      setSearchMessage('Selecciona fecha de ingreso y fecha de salida para buscar disponibilidad.');
      return;
    }

    if (!Number.isFinite(guests) || guests <= 0) {
      setSearchMessage('Ingresa un numero valido de personas.');
      return;
    }

    if (checkInDate >= checkOutDate) {
      setSearchMessage('La fecha de check-in debe ser anterior al check-out.');
      return;
    }

    if (effectivePriceMin > effectivePriceMax) {
      setSearchMessage('El precio minimo no puede ser mayor al precio maximo.');
      return;
    }

    setSearchMessage(null);
    setIsSearching(true);

    try {
      const recommendationsEntries = await Promise.all(
        allCards.map(async (card) => {
          const candidateRoomTypes = card.roomTypes.filter((roomType) => roomType.capacity >= guests && roomType.pricePerNight >= effectivePriceMin && roomType.pricePerNight <= effectivePriceMax);

          if (candidateRoomTypes.length === 0) return null;

          const availabilityByType = await Promise.all(
            candidateRoomTypes.map(async (roomType) => {
              const roomUnits = await listPublicAvailableRoomUnitsByRoomType(card.id, roomType.id, checkInDate, checkOutDate);
              return { roomType, availableUnits: roomUnits.length };
            })
          );

          const withAvailability = availabilityByType.filter((item) => item.availableUnits > 0);
          if (withAvailability.length === 0) return null;

          withAvailability.sort((a, b) => {
            const byPrice = a.roomType.pricePerNight - b.roomType.pricePerNight;
            if (byPrice !== 0) return byPrice;
            return a.roomType.capacity - b.roomType.capacity;
          });

          return [card.id, { roomType: withAvailability[0].roomType, availableUnits: withAvailability[0].availableUnits }] as const;
        })
      );

      const recommendations = Object.fromEntries(recommendationsEntries.filter((item): item is readonly [number, SearchRecommendation] => item !== null));

      setSearchRecommendations(recommendations);
      setHasSearched(true);
      setActiveSearchDates({ checkInDate, checkOutDate });

      const total = Object.keys(recommendations).length;
      setSearchMessage(total > 0 ? `${total} establecimiento(s) disponible(s) para tu busqueda.` : 'No hay disponibilidad con las fechas, personas y precios seleccionados.');
    } catch (error) {
      setSearchMessage(getApiErrorMessage(error, 'No se pudo completar la busqueda de disponibilidad.'));
    } finally {
      setIsSearching(false);
    }
  }

  function clearFilters() {
    setSearchText('');
    setServiceFilter('');
    setSortBy('NAME_ASC');
    setPriceMin(globalPriceRange.min);
    setPriceMax(globalPriceRange.max);
    setCheckInDate('');
    setCheckOutDate('');
    setGuests(2);
    setHasSearched(false);
    setSearchRecommendations({});
    setActiveSearchDates(null);
    setSearchMessage(null);
  }

  return (
    <div className="min-h-screen w-full">
      <main className="mx-auto px-4 pb-6 pt-5 md:px-6 lg:px-8" style={{ maxWidth: '1280px' }}>
        {/* Search section */}
        <section className="surface-card border-round-lg shadow-2 p-4 md:p-5" id="inicio">
          <h1 className="text-2xl md:text-4xl text-900 m-0">Busca hospedaje por fechas y personas</h1>
          <p className="mt-2 text-sm md:text-base text-600" style={{ maxWidth: '56rem' }}>
            Ingresa tus fechas de viaje y cantidad de personas para ver establecimientos con disponibilidad real.
          </p>

          {/* Entrepreneur banner */}
          <div
            className="mt-4 border-round-xl p-4 flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3"
            style={{ background: 'linear-gradient(135deg, rgba(80,188,178,0.14), rgba(243,215,144,0.16))', border: '1px solid rgba(80,188,178,0.25)' }}
          >
            <div>
              <p className="text-sm font-semibold m-0" style={{ color: 'var(--primary-color)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                ¿Eres emprendedor?
              </p>
              <p className="mt-1 text-sm text-900 m-0">Solicita unirte y registra tu establecimiento para revision manual con verificacion del RUC.</p>
            </div>
            <Link href="/landing/membership-request">
              <Button label="Solicitar unirse" severity="secondary" className="white-space-nowrap" />
            </Link>
          </div>

          {/* Search form */}
          <div className="mt-4 grid formgrid">
            <div className="field col-12 md:col-3">
              <label htmlFor="checkIn" className="text-sm font-semibold text-900">
                Fecha ingreso
              </label>
              <InputText id="checkIn" type="date" className="w-full" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
            </div>
            <div className="field col-12 md:col-3">
              <label htmlFor="checkOut" className="text-sm font-semibold text-900">
                Fecha salida
              </label>
              <InputText id="checkOut" type="date" className="w-full" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} />
            </div>
            <div className="field col-12 md:col-3">
              <label htmlFor="guests" className="text-sm font-semibold text-900">
                Numero de personas
              </label>
              <InputNumber id="guests" className="w-full" value={guests} onValueChange={(e) => setGuests(e.value ?? 2)} min={1} showButtons />
            </div>
            <div className="field col-12 md:col-3 flex align-items-end">
              <Button label={isSearching ? 'Buscando...' : 'Buscar'} icon="pi pi-search" className="w-full" disabled={isSearching || catalogQuery.isLoading} loading={isSearching} onClick={() => void runAvailabilitySearch()} />
            </div>
          </div>

          {searchMessage && <Message severity={hasSearched && Object.keys(searchRecommendations).length > 0 ? 'success' : 'info'} text={searchMessage} className="w-full mt-2" />}
        </section>

        {/* Catalog section */}
        <section className="mt-5 grid" id="catalogo">
          {/* Filters sidebar */}
          <div className="col-12 xl:col-3">
            <div className="surface-card border-round-lg shadow-2 p-4 sticky" style={{ top: '5rem' }}>
              <h2 className="text-lg m-0" style={{ color: 'var(--primary-color)' }}>
                Filtros
              </h2>

              <div className="mt-4 flex flex-column gap-3">
                <div>
                  <label htmlFor="search" className="block text-sm font-semibold text-900 mb-2">
                    Buscar establecimientos
                  </label>
                  <span className="p-input-icon-left w-full">
                    <i className="pi pi-search"></i>
                    <InputText id="search" className="w-full" placeholder="Nombre, descripcion o direccion" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                  </span>
                </div>

                <div className="grid formgrid">
                  <div className="field col-12 md:col-6 xl:col-12">
                    <label htmlFor="priceMin" className="block text-sm font-semibold text-900 mb-2">
                      Precio minimo (USD)
                    </label>
                    <InputNumber id="priceMin" className="w-full" value={priceMin} onValueChange={(e) => setPriceMin(e.value ?? 0)} min={0} mode="currency" currency="USD" locale="en-US" />
                  </div>
                  <div className="field col-12 md:col-6 xl:col-12">
                    <label htmlFor="priceMax" className="block text-sm font-semibold text-900 mb-2">
                      Precio maximo (USD)
                    </label>
                    <InputNumber id="priceMax" className="w-full" value={priceMax} onValueChange={(e) => setPriceMax(e.value ?? 0)} min={0} mode="currency" currency="USD" locale="en-US" />
                  </div>
                </div>

                <small className="text-500">
                  Rango registrado: {globalPriceRange.min.toFixed(2)} - {globalPriceRange.max.toFixed(2)} USD
                </small>

                <div>
                  <label htmlFor="serviceFilter" className="block text-sm font-semibold text-900 mb-2">
                    Servicio
                  </label>
                  <Dropdown id="serviceFilter" options={serviceOptions} value={serviceFilter} onChange={(e) => setServiceFilter(e.value)} className="w-full" placeholder="Todos" />
                </div>

                <Button label="Limpiar filtros" icon="pi pi-filter-slash" className="p-button-outlined w-full" onClick={clearFilters} />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="col-12 xl:col-9">
            <div className="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-2 mb-3">
              <p className="text-sm text-600 m-0">{filteredCatalog.length} resultado(s)</p>
              <div className="flex align-items-center gap-2">
                <label htmlFor="sortBy" className="text-sm font-semibold text-900">
                  Ordenar
                </label>
                <Dropdown id="sortBy" options={SORT_OPTIONS} value={sortBy} onChange={(e) => setSortBy(e.value)} className="w-auto" />
              </div>
            </div>

            {/* Loading skeletons */}
            {catalogQuery.isLoading && (
              <div className="flex flex-column gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`sk-${i}`} className="surface-card border-round-lg p-4 shadow-1">
                    <Skeleton height="8rem" className="mb-3" />
                    <Skeleton width="60%" className="mb-2" />
                    <Skeleton width="100%" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {catalogQuery.isError && <Message severity="error" text={getApiErrorMessage(catalogQuery.error, 'No se pudo cargar el catalogo de establecimientos.')} className="w-full" />}

            {/* Cards */}
            {!catalogQuery.isLoading && !catalogQuery.isError && (
              <div className="flex flex-column gap-3">
                {filteredCatalog.map((item) => {
                  const recommendation = searchRecommendations[item.id];
                  const recommendedRoomType = recommendation?.roomType;

                  const targetLink =
                    hasSearched && recommendation && activeSearchDates
                      ? `/landing/establishments/${item.id}/rooms/${recommendedRoomType.id}?checkInDate=${activeSearchDates.checkInDate}&checkOutDate=${activeSearchDates.checkOutDate}`
                      : `/landing/establishments/${item.id}/rooms`;

                  return (
                    <article key={item.id} className="surface-card border-round-lg shadow-2 overflow-hidden">
                      <div className="flex flex-column lg:flex-row">
                        {/* Image */}
                        {item.imageUrl ? (
                          <div className="relative w-full lg:w-3 overflow-hidden" style={{ minHeight: '12rem' }}>
                            <img className="w-full h-full absolute top-0 left-0" src={item.imageUrl} alt={item.name} style={{ objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div className="w-full lg:w-3 flex align-items-center justify-content-center p-4" style={{ minHeight: '12rem', background: 'linear-gradient(135deg, rgba(80,188,178,0.2), rgba(141,193,65,0.12), rgba(243,215,144,0.2))' }}>
                            <span className="text-xs font-semibold text-600 text-center">{item.name}</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 flex flex-column gap-3 p-4 lg:p-5">
                          <h3 className="text-base text-900 m-0">{item.name}</h3>
                          <p className="text-sm text-600 m-0" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.description}
                          </p>

                          <div>
                            <small className="font-semibold uppercase text-500" style={{ letterSpacing: '0.12em', fontSize: '0.68rem' }}>
                              Ubicacion
                            </small>
                            <p className="text-sm text-700 m-0 mt-1">{item.address}</p>
                            {item.parish && (
                              <div className="mt-2">
                                <small className="font-semibold uppercase text-500" style={{ letterSpacing: '0.12em', fontSize: '0.68rem' }}>
                                  Parroquia
                                </small>
                                <p className="text-sm text-700 m-0 mt-1">{getParishLabel(item.parish)}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <small className="font-semibold uppercase text-500" style={{ letterSpacing: '0.12em', fontSize: '0.68rem' }}>
                              Servicios
                            </small>
                            {item.services.length === 0 ? (
                              <p className="text-sm text-500 m-0 mt-1">No hay servicios visibles.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.services.slice(0, 5).map((serviceName) => (
                                  <Tag key={`${item.id}-${serviceName}`} value={serviceName} severity="info" />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Recommendation */}
                          {hasSearched && recommendation && (
                            <div className="border-round-lg p-3" style={{ background: 'rgba(80,188,178,0.1)', border: '1px solid rgba(80,188,178,0.35)' }}>
                              <small className="font-semibold uppercase text-500" style={{ letterSpacing: '0.12em', fontSize: '0.68rem' }}>
                                Habitacion recomendada
                              </small>
                              <p className="text-sm font-semibold text-900 m-0 mt-1">{recommendedRoomType.name}</p>
                              <p className="text-xs text-600 m-0 mt-1">Capacidad: {recommendedRoomType.capacity} persona(s)</p>
                              <p className="text-xs text-600 m-0 mt-1">Precio por noche: {Number(recommendedRoomType.pricePerNight).toFixed(2)} USD</p>
                              <p className="text-xs text-600 m-0 mt-1">Unidades disponibles: {recommendation.availableUnits}</p>
                            </div>
                          )}

                          <div className="flex justify-content-end mt-auto pt-2">
                            <Link href={targetLink}>
                              <Button label={hasSearched && recommendation ? 'Ver habitacion recomendada' : 'Ver habitaciones'} icon="pi pi-arrow-right" iconPos="right" className="p-button-outlined" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {!catalogQuery.isLoading && !catalogQuery.isError && filteredCatalog.length === 0 && <Message severity="info" text="No se encontraron establecimientos con los filtros seleccionados." className="w-full" />}
          </div>
        </section>

        {/* Footer */}
        <section className="mt-5 surface-card border-round-lg p-4 text-sm text-600" id="nosotros">
          <p className="m-0">Sigchos Booking conecta viajeros con experiencias de alojamiento y turismo rural en el canton Sigchos.</p>
        </section>
      </main>
    </div>
  );
}
