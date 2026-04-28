// 全局状态：保存所有笔记的备份用于搜索
let allNotes = [];

function setSyncStatus(text) {
    const el = document.getElementById('syncStatus');
    if(el) el.innerText = text;
}

// 同步单个字段（文字内容）
async function saveField(id, field, value) {
    setSyncStatus("Syncing...");
    const { error } = await _supabase.from('notes').update({ [field]: value }).eq('id', id);
    
    // 更新本地备份，确保搜索结果同步
    const note = allNotes.find(n => n.id === id);
    if(note) note[field] = value;

    setSyncStatus(error ? "Sync Error" : "Cloud Synced");
}

// 搜索逻辑
function handleSearch() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allNotes.filter(note => {
        return (note.excerpt?.toLowerCase().includes(keyword)) || 
               (note.reflection?.toLowerCase().includes(keyword)) ||
               (note.source_chapter?.toLowerCase().includes(keyword)) ||
               (note.tags?.some(t => t.toLowerCase().includes(keyword))); // 增加标签搜索
    });
    
    // 重新渲染过滤后的结果
    renderAll(filtered);
}

// 删除笔记
async function deleteNote(btn, id) {
    if (confirm("确定要删除这条笔记吗？")) {
        setSyncStatus("Deleting...");
        const { error } = await _supabase.from('notes').delete().eq('id', id);
        if (!error) {
            allNotes = allNotes.filter(n => n.id !== id);
            btn.closest('.note-unit').remove();
            setSyncStatus("Cloud Synced");
        }
    }
}

// 添加标签
async function addTag(btn, id) {
    const val = prompt("Tag Name?");
    if(val) {
        setSyncStatus("Updating Tags...");
        const note = allNotes.find(n => n.id === id);
        const newTags = [...(note.tags || []), val];
        const { error } = await _supabase.from('notes').update({ tags: newTags }).eq('id', id);
        if(!error) {
            note.tags = newTags;
            // 标签由于结构复杂，建议刷新或局部重绘
            location.reload(); 
        }
    }
}

// 移除标签
async function removeTag(span, id, tagText) {
    const note = allNotes.find(n => n.id === id);
    const newTags = note.tags.filter(t => t !== tagText);
    const { error } = await _supabase.from('notes').update({ tags: newTags }).eq('id', id);
    if(!error) {
        note.tags = newTags;
        span.parentElement.remove();
        setSyncStatus("Cloud Synced");
    }
}