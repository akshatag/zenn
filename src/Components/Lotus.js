import { motion } from "framer-motion";

function Lotus() {
  return (
    <motion.div animate={{y: [0, -40], opacity: [0, 1]}} transition={{duration: 0.75}}>
      <motion.svg width="200" height="100" viewBox="-315 100 800 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.path  style={{originX: 0.5, originY: 1}} animate={{ rotate: 55 }} transition={{delay: 1, duration: 0.5}} d="M169.5 171C169.5 219.122 152.065 256.764 133.259 282.383C123.853 295.197 114.125 304.973 106.115 311.517C102.106 314.792 98.5645 317.227 95.7435 318.825C94.3313 319.625 93.1413 320.191 92.194 320.55C91.1956 320.929 90.6632 321 90.5 321C89.114 321 86.6425 320.37 83.1553 318.723C79.7578 317.118 75.6742 314.682 71.1584 311.411C62.1316 304.872 51.533 295.105 41.4166 282.298C21.1931 256.697 3 219.085 3 171C3 76.7177 60.5471 23.5292 90.2152 3.77278C110.901 22.353 169.5 77.3754 169.5 171Z" fill="white" stroke="black" stroke-width="3"/>
        <motion.path  style={{originX: 0.5, originY: 1}} animate={{ rotate: -55 }} transition={{delay: 1, duration: 0.5}} d="M169.5 171C169.5 219.122 152.065 256.764 133.259 282.383C123.853 295.197 114.125 304.973 106.115 311.517C102.106 314.792 98.5645 317.227 95.7435 318.825C94.3313 319.625 93.1413 320.191 92.194 320.55C91.1956 320.929 90.6632 321 90.5 321C89.114 321 86.6425 320.37 83.1553 318.723C79.7578 317.118 75.6742 314.682 71.1584 311.411C62.1316 304.872 51.533 295.105 41.4166 282.298C21.1931 256.697 3 219.085 3 171C3 76.7177 60.5471 23.5292 90.2152 3.77278C110.901 22.353 169.5 77.3754 169.5 171Z" fill="white" stroke="black" stroke-width="3"/>
        <motion.path  style={{originX: 0.5, originY: 1}} animate={{ rotate: 35 }} transition={{delay: 1, duration: 0.5}} d="M169.5 171C169.5 219.122 152.065 256.764 133.259 282.383C123.853 295.197 114.125 304.973 106.115 311.517C102.106 314.792 98.5645 317.227 95.7435 318.825C94.3313 319.625 93.1413 320.191 92.194 320.55C91.1956 320.929 90.6632 321 90.5 321C89.114 321 86.6425 320.37 83.1553 318.723C79.7578 317.118 75.6742 314.682 71.1584 311.411C62.1316 304.872 51.533 295.105 41.4166 282.298C21.1931 256.697 3 219.085 3 171C3 76.7177 60.5471 23.5292 90.2152 3.77278C110.901 22.353 169.5 77.3754 169.5 171Z" fill="white" stroke="black" stroke-width="3"/>
        <motion.path  style={{originX: 0.5, originY: 1}} animate={{ rotate: -35 }} transition={{delay: 1, duration: 0.5}} d="M169.5 171C169.5 219.122 152.065 256.764 133.259 282.383C123.853 295.197 114.125 304.973 106.115 311.517C102.106 314.792 98.5645 317.227 95.7435 318.825C94.3313 319.625 93.1413 320.191 92.194 320.55C91.1956 320.929 90.6632 321 90.5 321C89.114 321 86.6425 320.37 83.1553 318.723C79.7578 317.118 75.6742 314.682 71.1584 311.411C62.1316 304.872 51.533 295.105 41.4166 282.298C21.1931 256.697 3 219.085 3 171C3 76.7177 60.5471 23.5292 90.2152 3.77278C110.901 22.353 169.5 77.3754 169.5 171Z" fill="white" stroke="black" stroke-width="3"/>
        <motion.path  style={{originX: 0.5, originY: 1}} animate={{ rotate: 0 }} transition={{delay: 1, duration: 0.5}} d="M169.5 171C169.5 219.122 152.065 256.764 133.259 282.383C123.853 295.197 114.125 304.973 106.115 311.517C102.106 314.792 98.5645 317.227 95.7435 318.825C94.3313 319.625 93.1413 320.191 92.194 320.55C91.1956 320.929 90.6632 321 90.5 321C89.114 321 86.6425 320.37 83.1553 318.723C79.7578 317.118 75.6742 314.682 71.1584 311.411C62.1316 304.872 51.533 295.105 41.4166 282.298C21.1931 256.697 3 219.085 3 171C3 76.7177 60.5471 23.5292 90.2152 3.77278C110.901 22.353 169.5 77.3754 169.5 171Z" fill="white" stroke="black" stroke-width="3"/>
      </motion.svg>
    </motion.div>
  )
}

export default Lotus;