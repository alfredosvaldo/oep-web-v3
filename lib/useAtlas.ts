'use client';
import { useEffect, useState, useRef } from 'react';
import { AtlasData, DEFAULT, fetchAtlas, Filters, paramsFor, readFilters } from './atlas';
export function useAtlas() {
  const [data,setData]=useState<AtlasData|null>(null), [error,setError]=useState('');
  const load=()=>{setError('');fetchAtlas().then(setData).catch(()=>setError('No se pudo cargar el atlas. Comprueba tu conexión e inténtalo otra vez.'));};
  useEffect(load,[]);
  return {data,error,retry:load};
}
export function useFilters(defaults: Filters = DEFAULT) {
  const [filters,setFilters]=useState(defaults);
  const current=useRef(defaults);
  useEffect(()=>{const restore=()=>{const next=readFilters(new URLSearchParams(window.location.search), defaults);current.current=next;setFilters(next);}; restore(); window.addEventListener('popstate',restore); return ()=>window.removeEventListener('popstate',restore);},[]);
  const update=(patch: Partial<Filters>, replace=false)=>{const next={...current.current,...patch};current.current=next;const url=`${window.location.pathname}?${paramsFor(next)}`; if(replace) window.history.replaceState(null,'',url); else window.history.pushState(null,'',url);setFilters(next);};
  return {filters,update};
}
