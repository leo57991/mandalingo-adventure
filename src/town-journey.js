import {SHOPS,TOWN} from './town-layout.js?v=wuyin-world-v1';

// Story discoveries are separate from Mandarin evidence and never authorize language actions.
const shopIds=SHOPS.map(s=>s.id);
export const TOWN_TRAVELLER=Object.freeze({id:'town-traveller',x:1980,y:2240,color:0x987747});
export function createTownJourney(saved={},resolved=false){
 const source=saved&&typeof saved==='object'?saved:{};
 const introduced=resolved&&Array.isArray(source.introduced)?[...new Set(source.introduced.filter(id=>shopIds.includes(id)))]:[];
 const location=resolved&&source.location==='town'?'town':'courtyard',allowed=['entry',...shopIds,'well','jade'];
 return {location,checkpoint:location==='town'&&allowed.includes(source.checkpoint)?source.checkpoint:location==='town'?'entry':'gate',introduced,signalSeen:introduced.length>=2&&source.signalSeen===true};
}
export const townSignalAwake=journey=>(journey?.introduced?.length??0)>=2;
export function townCheckpointPosition(journey){
 const shop=SHOPS.find(s=>s.id===journey?.checkpoint);
 if(shop)return {x:shop.x,y:shop.y+shop.depth/2+45};
 if(journey?.checkpoint==='well')return {x:TOWN_TRAVELLER.x,y:TOWN_TRAVELLER.y+90};
 if(journey?.checkpoint==='jade')return {x:2300,y:1920};
 return {...TOWN.spawn};
}
export function townExtraColliders(journey){return townSignalAwake(journey)?[[TOWN_TRAVELLER.x-18,TOWN_TRAVELLER.y-15,36,30]]:[];}
export function townEntities(journey){
 const entities=SHOPS.map(s=>({id:`town-${s.id}`,shopId:s.id,actorId:`${s.id==='lingxi-books'?'books':s.id}-vendor`,x:s.x,y:s.y+s.depth/2+15,label:s.name,action:'Visit',interactionRadius:120,type:'town'}));
 entities.push({id:'town-jade',x:2350,y:1790,label:'Jade lantern',action:'Observe',interactionRadius:175,type:'town'});
 if(townSignalAwake(journey))entities.push({...TOWN_TRAVELLER,actorId:TOWN_TRAVELLER.id,label:'Familiar traveller',action:'Talk',interactionRadius:135,type:'town'});
 return entities;
}
export function townObservation(entity,journey){
 const common={...entity,type:'town'},descriptions={
  weapons:['The forge is warm. Blades rest on the rack, their edges catching the light.','The smith acknowledges you with a nod. The road through the open gate has brought a new face to his counter.'],
  grocer:['Fruit, jars and travelling supplies crowd the stall. A cup of water rests among the goods.','The stallholder turns to greet you with a welcoming nod. Town life carries on around you.'],
  'lingxi-books':['Tied scrolls line the shelves. An open volume lies on the desk.','Beyond the counter, a small jade lantern stands in a quiet courtyard. The keeper glances toward the square.']
 };
 if(entity.shopId)return {...common,title:entity.label,lines:descriptions[entity.shopId]};
 if(entity.id==='town-traveller')return {...common,title:'A familiar face',lines:['The traveller you helped at the gate has reached the well. He is standing steadily now.','He recognizes you, rests a hand over his heart, and bows. A clear note carries across the square.']};
 return {...common,title:'The jade lantern',lines:journey.signalSeen?['The jade holds a steady light. The small rings have faded, but the town no longer feels quite the same.']:townSignalAwake(journey)?['A pale current gathers inside the jade. Small rings spread through the air, like ripples on the courtyard water.','For a moment, the lanterns along the street answer in unison. Then the town falls quiet again.']:['A pale stone rests inside a bronze frame. Its light is still and faint.']};
}
