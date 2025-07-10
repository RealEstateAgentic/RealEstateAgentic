import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { Button } from '../ui/button'
import { dummyData } from '../../data/dummy-data'

export function UrgentTodos() {
  const [todos, setTodos] = useState(dummyData.urgentTodos)
  const [newTodo, setNewTodo] = useState('')

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const addTodo = () => {
    if (newTodo.trim()) {
      const newId = Math.max(...todos.map(t => t.id)) + 1
      setTodos([...todos, { id: newId, task: newTodo, completed: false }])
      setNewTodo('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full flex flex-col">
      {/* Fixed Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800">Urgent To-Dos</h3>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-3">
          {todos.map((todo) => (
            <div key={todo.id} className="flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                  todo.completed
                    ? 'bg-[#A9D09E] border-[#A9D09E] text-white'
                    : 'border-gray-300 hover:border-[#3B7097]'
                }`}
              >
                {todo.completed && <Check className="size-3" />}
              </button>
              <span className={`flex-1 text-sm ${
                todo.completed ? 'line-through text-gray-500' : 'text-gray-700'
              }`}>
                {todo.task}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Footer - Add Todo Input */}
      <div className="p-6 border-t border-gray-200 flex-shrink-0">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new to-do..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
          />
          <Button
            onClick={addTodo}
            size="sm"
            className="bg-[#3B7097] hover:bg-[#3B7097]/90"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 