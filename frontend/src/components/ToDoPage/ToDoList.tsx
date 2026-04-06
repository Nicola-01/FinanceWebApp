import React from 'react';
import { CheckCircle2, Circle, ArrowRightCircle } from 'lucide-react';
import { todoData, type ToDoItem, type ToDoStatus } from './todoData';

const StatusIcon = ({ status }: { status: ToDoStatus }) => {
    switch (status) {
        case 'FINISHED':
            return <CheckCircle2 className="w-6 h-6 text-[#00ff7f]" />;
        case 'STARTED':
            return <ArrowRightCircle className="w-6 h-6 text-cyan-400" />;
        case 'PLANNED':
        default:
            return <Circle className="w-6 h-6 text-gray-600" />;
    }
};

const StatusBadge = ({ status }: { status: ToDoStatus }) => {
    switch (status) {
        case 'FINISHED':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00ff7f]/10 text-[#00ff7f] border border-[#00ff7f]/20 text-xs font-semibold">Completed</span>;
        case 'STARTED':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 text-xs font-semibold">Started</span>;
        case 'PLANNED':
        default:
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 text-xs font-semibold">Planned</span>;
    }
};

const ToDoCard: React.FC<{ item: ToDoItem }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const showLimit = 3;
    const hasMore = (item.subtasks?.length || 0) > showLimit;
    const displayedSubtasks = isExpanded ? item.subtasks : item.subtasks?.slice(0, showLimit);

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm transition-all hover:bg-white/10 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <StatusIcon status={item.status} />
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                </div>
                <StatusBadge status={item.status} />
            </div>
            
            {item.description && (
                <p className="text-gray-400 text-sm leading-relaxed pl-9">
                    {item.description}
                </p>
            )}

            {item.subtasks && item.subtasks.length > 0 && (
                <div className="pl-9 mt-2">
                    <ul className="space-y-2">
                        {displayedSubtasks?.map((task, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                                {task}
                            </li>
                        ))}
                    </ul>
                    
                    {hasMore && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="mt-3 text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                        >
                            {isExpanded ? 'Show less' : `+${item.subtasks.length - showLimit} more subtasks (show more)`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const ToDoList: React.FC = () => {
    const finished = todoData.filter(i => i.status === 'FINISHED');
    const started = todoData.filter(i => i.status === 'STARTED');
    const planned = todoData.filter(i => i.status === 'PLANNED');

    return (
        <div className="max-w-4xl xl:max-w-6xl mx-auto space-y-12 pb-24">
            {started.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
                        Currently In Progress
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {started.map(item => <ToDoCard key={item.id} item={item} />)}
                    </div>
                </section>
            )}

            {planned.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-300">
                        <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                        Future Roadmap
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {planned.map(item => <ToDoCard key={item.id} item={item} />)}
                    </div>
                </section>
            )}

            {finished.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-300">
                        <span className="w-3 h-3 rounded-full bg-[#00ff7f]"></span>
                        Recently Shipped
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 opacity-80">
                        {finished.map(item => <ToDoCard key={item.id} item={item} />)}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ToDoList;
