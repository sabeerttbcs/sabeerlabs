(function(root){
  'use strict';
  function matchesProject(project,category,stage,query){
    const terms=String(query||'').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return (category==='all'||project.category===category)
      &&(stage==='all'||(project.statusGroup||project.status)===stage)
      &&terms.every(term=>String(project.search).toLocaleLowerCase().includes(term));
  }
  function makeEnquiry(data,typeText,recipient){
    const clean=value=>String(value||'').replace(/\r/g,'').trim();
    const line=value=>clean(value).replace(/\n/g,' ');
    const lines=['Hello Sabeer,','',`I would like to discuss: ${line(typeText)}.`,'',`Name: ${line(data.name)}`,`Email: ${line(data.email)}`];
    for(const [key,label] of [['company','Company'],['model','Collaboration model'],['budget','Indicative budget'],['timeline','Timeline']]){
      if(clean(data[key]))lines.push(`${label}: ${line(data[key])}`);
    }
    lines.push('','Project / requirements:',clean(data.description),'','Sent from an enquiry prepared on Sabeer’s portfolio.');
    const text=lines.join('\n');
    const mailto=`mailto:${recipient}?subject=${encodeURIComponent(line(typeText)+' enquiry — '+line(data.name))}&body=${encodeURIComponent(text)}`;
    return {text,mailto};
  }
  function nextMedia(indices,current,direction){
    if(!indices.length)return null;
    const position=Math.max(0,indices.indexOf(current));
    return indices[(position+direction+indices.length)%indices.length];
  }
  const api={matchesProject,makeEnquiry,nextMedia};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.PortfolioLogic=api;
})(globalThis);
