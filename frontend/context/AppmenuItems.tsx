import React, { createContext, useState, useContext, useEffect, SetStateAction, Dispatch } from 'react';
import translations from '../languages.json'

export interface iMenuItem {  
  id: string;
  titleKey: string;
  icon: string;
  color: string;
  href: string | (() => void) |null; // Puede ser una ruta o una función
}

export const AppmenuItems:iMenuItem[] = [
  { id:'1', titleKey: "screens.almacen", icon: "warehouse", color: "#3182ce", href: '/almacen' },
  { id:'2',titleKey: "screens.logistica", icon: "truck-delivery", color: "#0b4e27", href: '/logistica' },
  { id:'3',titleKey: "screens.cirugias", icon: "stethoscope", color: "#3182ce", href: '/cirugias' },
  { id:'4',titleKey: "screens.cirugias_programar", icon: "calendar-check", color: "#3182ce", href: '/cirugias_programar' },
  { id:'5',titleKey: "screens.recepcion", icon: "clipboard-list", color: "#48bb78", href:null},
  { id:'6',titleKey: "screens.carpetas", icon: "folder-account", color: "#beb535", href:null},
  { id:'7',titleKey: "screens.pickeo", icon: "hospital", color: "#3182ce", href: '/terminales' },
  { id:'8',titleKey: "screens.inventario", icon: "format-list-checks", color: "#ecc94b", href: null },
  { id:'9',titleKey: "screens.entradas", icon: "home-import-outline", color: "#48bb78", href: null },
  { id:'10',titleKey: "screens.salidas", icon: "home-export-outline", color: "#e53e3e", href: null},
  { id:'11',titleKey: "screens.activos", icon: "finance", color: "#ecc94b", href: null },
  { id:'12',titleKey: "screens.carpetas", icon: "folder-account", color: "#48bb78", href: null },
  { id:'13',titleKey: "screens.socios", icon: "account-multiple", color: "#e53e3e", href: null },
  { id:'14',titleKey: "screens.cirugias_buscar", icon: "file-search", color: "#ecc94b", href: null },
  { id:'15',titleKey: "screens.cirugias_calendario", icon: "calendar", color: "#48bb78", href: null }
];


export const AddMenuItem=(menu:any, key: string/*, set_soon: Dispatch<SetStateAction<boolean>>*/)=> {
  for (const item of AppmenuItems){
    if (item.titleKey === key){      
      const new_item : iMenuItem={
        id : item.id,
        titleKey : item.titleKey,
        icon : item.icon,
        color: item.color,
        href: item.href        
      };

      /*if (!item.href && set_soon){
        item.href =()=>{             
            set_soon(true);             
          };
      }    */    

      menu.push(new_item);
      break;
    }
  }  
};