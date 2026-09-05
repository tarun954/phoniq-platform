function mins(v){const [h,m]=String(v||'').slice(0,5).split(':').map(Number);return h*60+m;}
function hhmm(v){return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;}
function weekday(date){const [y,m,d]=date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d)).getUTCDay();}
function wallClockToUtc(date,time,timeZone='America/Chicago'){
  const [y,m,d]=date.split('-').map(Number); const [h,mi]=time.split(':').map(Number);
  let guess=Date.UTC(y,m-1,d,h,mi,0);
  const fmt=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  for(let i=0;i<3;i++){
    const p=Object.fromEntries(fmt.formatToParts(new Date(guess)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    const rendered=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,0);
    guess+=Date.UTC(y,m-1,d,h,mi,0)-rendered;
  }
  return new Date(guess).toISOString();
}
export async function getAvailableSlots({admin,organizationId,requestedDate,limit=12}){
  const wd=weekday(requestedDate);
  const [{data:org,error:oe},{data:profile},{data:company,error:ce},{data:staff,error:se}]=await Promise.all([
    admin.from('organizations').select('*').eq('id',organizationId).maybeSingle(),
    admin.from('company_profiles').select('*').eq('organization_id',organizationId).maybeSingle(),
    admin.from('company_availability').select('*').eq('organization_id',organizationId).eq('weekday',wd).maybeSingle(),
    admin.from('service_staff').select('*').eq('organization_id',organizationId).eq('active',true).order('name')
  ]);
  if(oe) throw oe; if(ce) throw ce; if(se) throw se;
  const companyName=profile?.company_name||profile?.name||org?.name||'Service Company';
  const timezone=profile?.timezone||org?.timezone||'America/Chicago';
  if(!company||company.enabled===false) return {companyName,timezone,requestedDate,slots:[],reason:'company_closed'};
  const ids=(staff||[]).map(s=>s.id); if(!ids.length) return {companyName,timezone,requestedDate,slots:[],reason:'no_active_staff'};
  const {data:schedules,error:sce}=await admin.from('staff_availability').select('*').eq('organization_id',organizationId).eq('weekday',wd).eq('enabled',true).in('staff_id',ids);
  if(sce) throw sce;
  const startDay=wallClockToUtc(requestedDate,'00:00',timezone); const nextDay=new Date(new Date(startDay).getTime()+86400000).toISOString();
  const {data:appts,error:ae}=await admin.from('appointments').select('id,staff_id,scheduled_at,status,booking_status').eq('organization_id',organizationId).gte('scheduled_at',startDay).lt('scheduled_at',nextDay);
  if(ae) throw ae;
  const staffMap=new Map((staff||[]).map(s=>[s.id,s])); const out=[];
  for(const sc of schedules||[]){
    const person=staffMap.get(sc.staff_id); if(!person) continue;
    const start=Math.max(mins(company.start_time),mins(sc.start_time)); const end=Math.min(mins(company.end_time),mins(sc.end_time));
    const dur=Number(sc.slot_minutes)||Number(company.slot_minutes)||60; if(start>=end) continue;
    for(let cur=start;cur+dur<=end;cur+=dur){
      const time=hhmm(cur); const scheduledAt=wallClockToUtc(requestedDate,time,timezone); const endAt=new Date(new Date(scheduledAt).getTime()+dur*60000).getTime();
      const conflict=(appts||[]).some(a=>a.staff_id===person.id && a.scheduled_at && !['cancelled','canceled','declined','deleted'].includes(String(a.booking_status||a.status||'').toLowerCase()) && new Date(a.scheduled_at).getTime()<endAt && new Date(a.scheduled_at).getTime()+dur*60000>new Date(scheduledAt).getTime());
      if(!conflict) out.push({date:requestedDate,time,scheduledAt,slotMinutes:dur,staffId:person.id,staffName:person.name});
    }
  }
  const unique=[]; const seen=new Set(); for(const s of out.sort((a,b)=>new Date(a.scheduledAt)-new Date(b.scheduledAt))){if(!seen.has(s.time)){seen.add(s.time);unique.push(s);} if(unique.length>=limit)break;}
  return {companyName,timezone,requestedDate,slots:unique,reason:unique.length?null:'no_slots'};
}
